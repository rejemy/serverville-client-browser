/// <reference path="serverville_messages.ts" />
/// <reference path="serverville_http.ts" />
/// <reference path="serverville_ws.ts" />

// Generated, unfortunately. Edit original template in browser/templates/serverville.ts.tmpl

namespace sv
{

	type ServerMessageTypeHandler = (from:string, via:string, msg:Object)=>void;
	
	export class Serverville
	{
		ServerURL:string;

		SessionId:string;
        
		private UserInfo:UserAccountInfo;
	
        LogMessagesToConsole:boolean = false;
        PingPeriod:number = 5000;

        private Transport:ServervilleTransport;
        
		GlobalErrorHandler:(ev:ErrorReply)=>void;
		
		ServerMessageTypeHandlers:{[id:string]:ServerMessageTypeHandler} = {};
		ServerMessageHandler:(messageType:string, from:string, via:string, msg:Object)=>void;
		
		private LastSend:number = 0;
		private PingTimer:number = 0;

		private LastServerTime:number = 0;
		private LastServerTimeAt:number = 0;
		
		constructor(url:string)
		{
			this.ServerURL = url;
			this.SessionId = localStorage.getItem("SessionId");
            
            if(this.ServerURL.substr(0, 5) == "ws://" || this.ServerURL.substr(0, 6) == "wss://")
            {
                this.Transport = new WebSocketTransport(this);
            }
            else if(this.ServerURL.substr(0, 7) == "http://" || this.ServerURL.substr(0, 8) == "https://")
            {
                this.Transport = new HttpTransport(this);
            }
            else
            {
                throw "Unknown server protocol: "+url;
            }
		}
		
		init(onComplete:(user:UserAccountInfo, err:ErrorReply)=>void):void
		{
			var self:Serverville = this;
			
            this.Transport.init(function(err:ErrorReply):void
            {
                if(err != null)
                {
                    onComplete(null, err);
                    return;
                }
                
                if(self.SessionId)
                {
                    self.validateSession(self.SessionId,
                    function(reply:UserAccountInfo):void
                    {
                        onComplete(reply, null);

						self.startPingHeartbeat();
                    },
                    function(err:ErrorReply):void
                    {
                        self.signOut();
                        onComplete(null, err);
                    });
                }
                else
                {
                    onComplete(null, null);
                }
            });
            
		}
	
		private startPingHeartbeat():void
		{
			if(this.PingTimer != 0)
				return;

			var self:Serverville = this;

			this.PingTimer = window.setInterval(function():void
			{
				self.ping();
			}, this.PingPeriod);
		}

		private stopPingHeartbeat():void
		{
			if(this.PingTimer != 0)
			{
				window.clearInterval(this.PingTimer);
			}
			this.PingTimer = 0;
		}
		private setUserInfo(userInfo:SignInReply):void
		{
			if(userInfo == null)
			{
				this.UserInfo = null;
				this.SessionId = null;
				localStorage.removeItem("SessionId");
			}
			else
			{
				this.UserInfo = userInfo;
				this.SessionId = userInfo.session_id;
				localStorage.setItem("SessionId", this.SessionId);

				this.setServerTime(userInfo.time);
			}
		}
		
		userInfo():UserAccountInfo
		{
			return this.UserInfo;
		}
		
		_onServerError(err:ErrorReply):void
		{
			if(this.GlobalErrorHandler != null)
				this.GlobalErrorHandler(err);

			if(err.errorCode == 19) // Session expired
			{
				this.shutdown();
			}
		}
		
		_onServerMessage(messageId:string, from:string, via:string, data:Object):void
		{
			if(messageId == "_error")
			{
				// Pushed error
				this._onServerError(<ErrorReply>data);
				return;
			}

			var typeHandler:ServerMessageTypeHandler = this.ServerMessageTypeHandlers[messageId];
			if(typeHandler != null)
			{
				typeHandler(from, via, data);
			}
			else if(this.ServerMessageHandler != null)
			{
				this.ServerMessageHandler(messageId, from, via, data);
			}
			else
			{
				console.log("No handler for message "+messageId);
			}
		}
		
		_onTransportClosed():void
		{
			this.stopPingHeartbeat();

			this._onServerError(makeClientError(-1));
		}

		private ping():void
		{
			if(performance.now() - this.LastSend < 4000)
				return;

			var self:Serverville = this;

			this.getTime(function(reply:ServerTime):void
			{
				self.setServerTime(reply.time);
			});
		}

		setServerTime(time:number):void
		{
			this.LastServerTime = time;
			this.LastServerTimeAt = performance.now();
		}

		getServerTime():number
		{
			if(this.LastServerTime == 0)
				return 0;
			return (performance.now() - this.LastServerTimeAt) + this.LastServerTime;
		}

		getLastSendTime():number
		{
			return this.LastSend;
		}

		loadUserKeyData(onDone?:()=>void):KeyData
		{
			if(!this.UserInfo)
				throw "No user loaded";
				
			var data:KeyData = new KeyData(this, this.UserInfo.user_id);
			data.loadAll(onDone);
			return data;
		}
		
		loadKeyData(id:string, onDone?:()=>void):KeyData
		{
			var data:KeyData = new KeyData(this, id);
			data.loadAll(onDone);
			return data;
		}
		
		isSignedIn():boolean
		{
			return this.SessionId != null;
		}
		
        signOut():void
		{
			this.setUserInfo(null);
			
		}
        
		shutdown():void
		{
			this.stopPingHeartbeat();

			if(this.Transport)
			{
				this.Transport.close();
			}
		}

        apiByName(api:string, request:Object, onSuccess:(reply:Object)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.Transport.callApi(api,
				request,
				onSuccess,
				onError
			);

			this.LastSend = performance.now();
		}
        
		signInReq(request:SignIn, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            var self:Serverville = this;
			this.apiByName("SignIn",
				request,
				function(reply:SignInReply):void { self.setUserInfo(reply); if(onSuccess) { onSuccess(reply);} },
				onError
			);
		}

		signIn(username:string, email:string, password:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.signInReq(
				{
					"username":username,
					"email":email,
					"password":password
				},
				onSuccess,
				onError
			);
		}

		validateSessionReq(request:ValidateSessionRequest, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            var self:Serverville = this;
			this.apiByName("ValidateSession",
				request,
				function(reply:SignInReply):void { self.setUserInfo(reply); if(onSuccess) { onSuccess(reply);} },
				onError
			);
		}

		validateSession(session_id:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.validateSessionReq(
				{
					"session_id":session_id
				},
				onSuccess,
				onError
			);
		}

		createAnonymousAccountReq(request:CreateAnonymousAccount, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            var self:Serverville = this;
			this.apiByName("CreateAnonymousAccount",
				request,
				function(reply:SignInReply):void { self.setUserInfo(reply); if(onSuccess) { onSuccess(reply);} },
				onError
			);
		}

		createAnonymousAccount(invite_code:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.createAnonymousAccountReq(
				{
					"invite_code":invite_code
				},
				onSuccess,
				onError
			);
		}

		createAccountReq(request:CreateAccount, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            var self:Serverville = this;
			this.apiByName("CreateAccount",
				request,
				function(reply:SignInReply):void { self.setUserInfo(reply); if(onSuccess) { onSuccess(reply);} },
				onError
			);
		}

		createAccount(username:string, email:string, password:string, invite_code:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.createAccountReq(
				{
					"username":username,
					"email":email,
					"password":password,
					"invite_code":invite_code
				},
				onSuccess,
				onError
			);
		}

		convertToFullAccountReq(request:CreateAccount, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            var self:Serverville = this;
			this.apiByName("ConvertToFullAccount",
				request,
				function(reply:SignInReply):void { self.setUserInfo(reply); if(onSuccess) { onSuccess(reply);} },
				onError
			);
		}

		convertToFullAccount(username:string, email:string, password:string, invite_code:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.convertToFullAccountReq(
				{
					"username":username,
					"email":email,
					"password":password,
					"invite_code":invite_code
				},
				onSuccess,
				onError
			);
		}

		getTimeReq(request:EmptyClientRequest, onSuccess?:(reply:ServerTime)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetTime",
				request,
				onSuccess,
				onError
			);
		}

		getTime(onSuccess?:(reply:ServerTime)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getTimeReq(
				{

				},
				onSuccess,
				onError
			);
		}

		getUserInfoReq(request:GetUserInfo, onSuccess?:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetUserInfo",
				request,
				onSuccess,
				onError
			);
		}

		getUserInfo(onSuccess?:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getUserInfoReq(
				{

				},
				onSuccess,
				onError
			);
		}

		setUserKeyReq(request:SetUserDataRequest, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("SetUserKey",
				request,
				onSuccess,
				onError
			);
		}

		setUserKey(key:string, value:any, data_type:JsonDataTypeEnum, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setUserKeyReq(
				{
					"key":key,
					"value":value,
					"data_type":data_type
				},
				onSuccess,
				onError
			);
		}

		setUserKeysReq(request:UserDataRequestList, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("SetUserKeys",
				request,
				onSuccess,
				onError
			);
		}

		setUserKeys(values:Array<SetUserDataRequest>, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setUserKeysReq(
				{
					"values":values
				},
				onSuccess,
				onError
			);
		}

		getUserKeyReq(request:KeyRequest, onSuccess?:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetUserKey",
				request,
				onSuccess,
				onError
			);
		}

		getUserKey(key:string, onSuccess?:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getUserKeyReq(
				{
					"key":key
				},
				onSuccess,
				onError
			);
		}

		getUserKeysReq(request:KeysRequest, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetUserKeys",
				request,
				onSuccess,
				onError
			);
		}

		getUserKeys(keys:Array<string>, since:number, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getUserKeysReq(
				{
					"keys":keys,
					"since":since
				},
				onSuccess,
				onError
			);
		}

		getAllUserKeysReq(request:AllKeysRequest, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetAllUserKeys",
				request,
				onSuccess,
				onError
			);
		}

		getAllUserKeys(since:number, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getAllUserKeysReq(
				{
					"since":since
				},
				onSuccess,
				onError
			);
		}

		getDataKeyReq(request:GlobalKeyRequest, onSuccess?:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetDataKey",
				request,
				onSuccess,
				onError
			);
		}

		getDataKey(id:string, key:string, onSuccess?:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getDataKeyReq(
				{
					"id":id,
					"key":key
				},
				onSuccess,
				onError
			);
		}

		getDataKeysReq(request:GlobalKeysRequest, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetDataKeys",
				request,
				onSuccess,
				onError
			);
		}

		getDataKeys(id:string, keys:Array<string>, since:number, include_deleted:boolean, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getDataKeysReq(
				{
					"id":id,
					"keys":keys,
					"since":since,
					"include_deleted":include_deleted
				},
				onSuccess,
				onError
			);
		}

		getAllDataKeysReq(request:AllGlobalKeysRequest, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetAllDataKeys",
				request,
				onSuccess,
				onError
			);
		}

		getAllDataKeys(id:string, since:number, include_deleted:boolean, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getAllDataKeysReq(
				{
					"id":id,
					"since":since,
					"include_deleted":include_deleted
				},
				onSuccess,
				onError
			);
		}

		getKeyDataRecordReq(request:KeyDataRecordRequest, onSuccess?:(reply:KeyDataInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetKeyDataRecord",
				request,
				onSuccess,
				onError
			);
		}

		getKeyDataRecord(id:string, onSuccess?:(reply:KeyDataInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getKeyDataRecordReq(
				{
					"id":id
				},
				onSuccess,
				onError
			);
		}

		setDataKeysReq(request:SetGlobalDataRequest, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("SetDataKeys",
				request,
				onSuccess,
				onError
			);
		}

		setDataKeys(id:string, values:Array<SetUserDataRequest>, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setDataKeysReq(
				{
					"id":id,
					"values":values
				},
				onSuccess,
				onError
			);
		}

		setTransientValueReq(request:SetTransientValueRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("SetTransientValue",
				request,
				onSuccess,
				onError
			);
		}

		setTransientValue(alias:string, key:string, value:any, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setTransientValueReq(
				{
					"alias":alias,
					"key":key,
					"value":value
				},
				onSuccess,
				onError
			);
		}

		setTransientValuesReq(request:SetTransientValuesRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("SetTransientValues",
				request,
				onSuccess,
				onError
			);
		}

		setTransientValues(alias:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setTransientValuesReq(
				{
					"alias":alias,
					"values":values
				},
				onSuccess,
				onError
			);
		}

		getTransientValueReq(request:GetTransientValueRequest, onSuccess?:(reply:TransientDataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetTransientValue",
				request,
				onSuccess,
				onError
			);
		}

		getTransientValue(id:string, alias:string, key:string, onSuccess?:(reply:TransientDataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getTransientValueReq(
				{
					"id":id,
					"alias":alias,
					"key":key
				},
				onSuccess,
				onError
			);
		}

		getTransientValuesReq(request:GetTransientValuesRequest, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetTransientValues",
				request,
				onSuccess,
				onError
			);
		}

		getTransientValues(id:string, alias:string, keys:Array<string>, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getTransientValuesReq(
				{
					"id":id,
					"alias":alias,
					"keys":keys
				},
				onSuccess,
				onError
			);
		}

		getAllTransientValuesReq(request:GetAllTransientValuesRequest, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetAllTransientValues",
				request,
				onSuccess,
				onError
			);
		}

		getAllTransientValues(id:string, alias:string, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getAllTransientValuesReq(
				{
					"id":id,
					"alias":alias
				},
				onSuccess,
				onError
			);
		}

		joinChannelReq(request:JoinChannelRequest, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("JoinChannel",
				request,
				onSuccess,
				onError
			);
		}

		joinChannel(alias:string, id:string, values:{[key:string]:any}, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.joinChannelReq(
				{
					"alias":alias,
					"id":id,
					"values":values
				},
				onSuccess,
				onError
			);
		}

		leaveChannelReq(request:LeaveChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("LeaveChannel",
				request,
				onSuccess,
				onError
			);
		}

		leaveChannel(alias:string, id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.leaveChannelReq(
				{
					"alias":alias,
					"id":id,
					"final_values":final_values
				},
				onSuccess,
				onError
			);
		}

		addAliasToChannelReq(request:JoinChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("AddAliasToChannel",
				request,
				onSuccess,
				onError
			);
		}

		addAliasToChannel(alias:string, id:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.addAliasToChannelReq(
				{
					"alias":alias,
					"id":id,
					"values":values
				},
				onSuccess,
				onError
			);
		}

		removeAliasFromChannelReq(request:LeaveChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("RemoveAliasFromChannel",
				request,
				onSuccess,
				onError
			);
		}

		removeAliasFromChannel(alias:string, id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.removeAliasFromChannelReq(
				{
					"alias":alias,
					"id":id,
					"final_values":final_values
				},
				onSuccess,
				onError
			);
		}

		listenToChannelReq(request:ListenToResidentRequest, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("ListenToChannel",
				request,
				onSuccess,
				onError
			);
		}

		listenToChannel(id:string, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.listenToChannelReq(
				{
					"id":id
				},
				onSuccess,
				onError
			);
		}

		stopListenToChannelReq(request:StopListenToResidentRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("StopListenToChannel",
				request,
				onSuccess,
				onError
			);
		}

		stopListenToChannel(id:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.stopListenToChannelReq(
				{
					"id":id
				},
				onSuccess,
				onError
			);
		}

		sendClientMessageReq(request:TransientMessageRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("SendClientMessage",
				request,
				onSuccess,
				onError
			);
		}

		sendClientMessage(to:string, alias:string, message_type:string, value:any, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.sendClientMessageReq(
				{
					"to":to,
					"alias":alias,
					"message_type":message_type,
					"value":value
				},
				onSuccess,
				onError
			);
		}


        
        
	}

		
}