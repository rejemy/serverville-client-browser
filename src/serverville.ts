/// <reference path="serverville_messages.ts" />
/// <reference path="serverville_http.ts" />
/// <reference path="serverville_ws.ts" />

// Generated, unfortunately. Edit original template in browser/templates/serverville.ts.tmpl

namespace sv
{
    
	export class Serverville
	{
		ServerURL:string;

		SessionId:string;
        
		UserInfo:SignInReply;
		
		GlobalErrorHandler:(ev:ErrorReply)=>void;
        
        LogMessagesToConsole:boolean = false;
        
        Transport:ServervilleTransport;
        
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
		
		init(onComplete:(user:SignInReply, err:ErrorReply)=>void):void
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
                    function(reply:SignInReply):void
                    {
                        onComplete(reply, null);
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
			}
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
        
		signInReq(request:SignIn, onSuccess:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            var self:Serverville = this;
			this.Transport.callApi("SignIn",
				request,
				function(reply:SignInReply):void { self.setUserInfo(reply); if(onSuccess) { onSuccess(reply);} },
				onError
			);
		}

		signIn(username:string, email:string, password:string, onSuccess:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
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

		validateSessionReq(request:ValidateSessionRequest, onSuccess:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            var self:Serverville = this;
			this.Transport.callApi("ValidateSession",
				request,
				function(reply:SignInReply):void { self.setUserInfo(reply); if(onSuccess) { onSuccess(reply);} },
				onError
			);
		}

		validateSession(session_id:string, onSuccess:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.validateSessionReq(
				{
					"session_id":session_id
				},
				onSuccess,
				onError
			);
		}

		createAnonymousAccountReq(request:CreateAnonymousAccount, onSuccess:(reply:CreateAccountReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("CreateAnonymousAccount",
				request,
				onSuccess,
				onError
			);
		}

		createAnonymousAccount(onSuccess:(reply:CreateAccountReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.createAnonymousAccountReq(
				{

				},
				onSuccess,
				onError
			);
		}

		createAccountReq(request:CreateAccount, onSuccess:(reply:CreateAccountReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("CreateAccount",
				request,
				onSuccess,
				onError
			);
		}

		createAccount(username:string, email:string, password:string, onSuccess:(reply:CreateAccountReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.createAccountReq(
				{
					"username":username,
					"email":email,
					"password":password
				},
				onSuccess,
				onError
			);
		}

		convertToFullAccountReq(request:CreateAccount, onSuccess:(reply:CreateAccountReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("ConvertToFullAccount",
				request,
				onSuccess,
				onError
			);
		}

		convertToFullAccount(username:string, email:string, password:string, onSuccess:(reply:CreateAccountReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.convertToFullAccountReq(
				{
					"username":username,
					"email":email,
					"password":password
				},
				onSuccess,
				onError
			);
		}

		getUserInfoReq(request:GetUserInfo, onSuccess:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            var self:Serverville = this;
			this.Transport.callApi("GetUserInfo",
				request,
				function(reply:SignInReply):void { self.setUserInfo(reply); if(onSuccess) { onSuccess(reply);} },
				onError
			);
		}

		getUserInfo(onSuccess:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getUserInfoReq(
				{

				},
				onSuccess,
				onError
			);
		}

		setUserKeyReq(request:SetUserDataRequest, onSuccess:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("SetUserKey",
				request,
				onSuccess,
				onError
			);
		}

		setUserKey(key:string, value:any, data_type:string, onSuccess:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
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

		setUserKeysReq(request:UserDataRequestList, onSuccess:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("SetUserKeys",
				request,
				onSuccess,
				onError
			);
		}

		setUserKeys(values:Array<SetUserDataRequest>, onSuccess:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setUserKeysReq(
				{
					"values":values
				},
				onSuccess,
				onError
			);
		}

		getUserKeyReq(request:KeyRequest, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("GetUserKey",
				request,
				onSuccess,
				onError
			);
		}

		getUserKey(key:string, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getUserKeyReq(
				{
					"key":key
				},
				onSuccess,
				onError
			);
		}

		getUserKeysReq(request:KeysRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("GetUserKeys",
				request,
				onSuccess,
				onError
			);
		}

		getUserKeys(keys:Array<string>, since:number, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
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

		getAllUserKeysReq(request:AllKeysRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("GetAllUserKeys",
				request,
				onSuccess,
				onError
			);
		}

		getAllUserKeys(since:number, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getAllUserKeysReq(
				{
					"since":since
				},
				onSuccess,
				onError
			);
		}

		getDataKeyReq(request:GlobalKeyRequest, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("GetDataKey",
				request,
				onSuccess,
				onError
			);
		}

		getDataKey(id:string, key:string, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
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

		getDataKeysReq(request:GlobalKeysRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("GetDataKeys",
				request,
				onSuccess,
				onError
			);
		}

		getDataKeys(id:string, keys:Array<string>, since:number, include_deleted:boolean, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
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

		getAllDataKeysReq(request:AllGlobalKeysRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("GetAllDataKeys",
				request,
				onSuccess,
				onError
			);
		}

		getAllDataKeys(id:string, since:number, include_deleted:boolean, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
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

		setTransientValueReq(request:SetTransientValueRequest, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("SetTransientValue",
				request,
				onSuccess,
				onError
			);
		}

		setTransientValue(key:string, value:any, data_type:string, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setTransientValueReq(
				{
					"key":key,
					"value":value,
					"data_type":data_type
				},
				onSuccess,
				onError
			);
		}

		setTransientValuesReq(request:SetTransientValuesRequest, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("SetTransientValues",
				request,
				onSuccess,
				onError
			);
		}

		setTransientValues(values:Array<SetTransientValueRequest>, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setTransientValuesReq(
				{
					"values":values
				},
				onSuccess,
				onError
			);
		}

		getTransientValueReq(request:GetTransientValueRequest, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("GetTransientValue",
				request,
				onSuccess,
				onError
			);
		}

		getTransientValue(id:string, key:string, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getTransientValueReq(
				{
					"id":id,
					"key":key
				},
				onSuccess,
				onError
			);
		}

		getTransientValuesReq(request:GetTransientValuesRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("GetTransientValues",
				request,
				onSuccess,
				onError
			);
		}

		getTransientValues(id:string, keys:Array<string>, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getTransientValuesReq(
				{
					"id":id,
					"keys":keys
				},
				onSuccess,
				onError
			);
		}

		getAllTransientValuesReq(request:GetAllTransientValuesRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("getAllTransientValues",
				request,
				onSuccess,
				onError
			);
		}

		getAllTransientValues(id:string, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getAllTransientValuesReq(
				{
					"id":id
				},
				onSuccess,
				onError
			);
		}

		getChannelInfoReq(request:JoinChannelRequest, onSuccess:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("GetChannelInfo",
				request,
				onSuccess,
				onError
			);
		}

		getChannelInfo(id:string, listen_only:boolean, onSuccess:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getChannelInfoReq(
				{
					"id":id,
					"listen_only":listen_only
				},
				onSuccess,
				onError
			);
		}

		joinChannelReq(request:JoinChannelRequest, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("JoinChannel",
				request,
				onSuccess,
				onError
			);
		}

		joinChannel(id:string, listen_only:boolean, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.joinChannelReq(
				{
					"id":id,
					"listen_only":listen_only
				},
				onSuccess,
				onError
			);
		}

		leaveChannelReq(request:LeaveChannelRequest, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("LeaveChannel",
				request,
				onSuccess,
				onError
			);
		}

		leaveChannel(id:string, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.leaveChannelReq(
				{
					"id":id
				},
				onSuccess,
				onError
			);
		}

		sendClientMessageReq(request:TransientMessageRequest, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.Transport.callApi("SendClientMessage",
				request,
				onSuccess,
				onError
			);
		}

		sendClientMessage(to:string, message_type:string, value:any, data_type:string, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.sendClientMessageReq(
				{
					"to":to,
					"message_type":message_type,
					"value":value,
					"data_type":data_type
				},
				onSuccess,
				onError
			);
		}


        
        
	}

		
}