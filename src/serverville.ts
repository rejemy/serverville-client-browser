/// <reference path="serverville_messages.ts" />
/// <reference path="serverville_http.ts" />
/// <reference path="serverville_ws.ts" />

// Generated, unfortunately. Edit original template in browser/templates/serverville.ts.tmpl

namespace sv
{

	type ServerMessageTypeHandler = (message:UserMessageNotification)=>void;
	
	export class Serverville
	{
		ServerURL:string;
		ServerHost:string;
		ServerProtocol:string;

		SessionId:string;
        
		private UserInfo:UserAccountInfo;
	
        LogMessagesToConsole:boolean = false;
        PingPeriod:number = 60000;

        private Transport:ServervilleTransport;
        
		GlobalErrorHandler:(ev:ErrorReply)=>void;
		
		UserMessageTypeHandlers:{[id:string]:ServerMessageTypeHandler} = {};
		UserMessageHandler:(message:UserMessageNotification)=>void;
		
		ResidentJoinedHandler:(notification:ResidentJoinedNotification)=>void;
		ResidentLeftHandler:(notification:ResidentLeftNotification)=>void;
		ResidentEventHandler:(notification:ResidentEventNotification)=>void;
		ResidentStateUpdateHandler:(notification:ResidentStateUpdateNotification)=>void;
		
		private LastSend:number = 0;
		private PingTimer:number = 0;

		private LastServerTime:number = 0;
		private LastServerTimeAt:number = 0;
		
		constructor(url:string)
		{
			this.SessionId = localStorage.getItem("SessionId");

			this.initServerUrl(url);
		}

		private initServerUrl(url:string):void
		{
			this.ServerURL = url;
			var protocolLen:number = this.ServerURL.indexOf("://");
			if(protocolLen < 2)
				throw "Malformed url: "+url;
            this.ServerHost = this.ServerURL.substring(protocolLen+3);
            this.ServerProtocol = this.ServerURL.substring(0, protocolLen);

            if(this.ServerProtocol == "ws" || this.ServerProtocol == "wss")
            {
                this.Transport = new WebSocketTransport(this);
            }
            else if(this.ServerProtocol == "http" || this.ServerProtocol == "https")
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
			
            function onTransportInitted(err:ErrorReply):void
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
						if(self.SessionId && err.errorCode == 2)
						{
							self.signOut();

							// Try again
							self.Transport.init(onTransportInitted);
							return;
						}
                        
                        onComplete(null, err);
                    });
                }
                else
                {
                    onComplete(null, null);
                }
            };
            
			this.Transport.init(onTransportInitted);
		}
	
		initWithResidentId(resId:string, onComplete:(user:UserAccountInfo, err:ErrorReply)=>void):void
		{
			if(!resId)
			{
				this.init(onComplete);
				return;
			}

			var serverUrl:string = this.ServerURL;
			if(this.ServerProtocol == "ws")
				serverUrl = "http://"+this.ServerHost;
			else if(this.ServerProtocol == "wss")
				serverUrl = "https://"+this.ServerHost;
			
			serverUrl += "/api/GetHostWithResident";
			
			var req:GetHostWithResidentRequest = 
			{
				resident_id: resId
			};

			var self:Serverville = this;

			HttpTransport.unauthedRequest(serverUrl, req,
				function(reply:GetHostWithResidentReply):void
				{
					var url:string = self.fixupServerURL(reply.host);
					self.initServerUrl(url);
					self.init(onComplete);
				},
				function(err:ErrorReply):void
				{
					onComplete(null, err);
				});
		}

		private fixupServerURL(host:string):string
		{
			var url:string = host;
			if(host.indexOf("://") < 0)
			{
				url = this.ServerProtocol + "://"+host;
			}
			return url;
		}

		switchHosts(host:string, onComplete:(err:ErrorReply)=>void):void
		{
			var url:string = this.fixupServerURL(host);

			if(this.ServerURL == url)
			{
				onComplete(null);
				return;
			}

			this.shutdown();

			this.initServerUrl(url);
			this.init(
				function(user:UserAccountInfo, err:ErrorReply):void
				{
					onComplete(err);
				}
			);
		}

		private startPingHeartbeat():void
		{
			if(this.PingPeriod == 0 || this.PingTimer != 0)
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
		
		private setUserSession(sessionId:string):void
		{
			this.SessionId = sessionId;
			localStorage.setItem("SessionId", this.SessionId);
		}	
		
		userInfo():UserAccountInfo
		{
			return this.UserInfo;
		}
		
		_onServerError(err:ErrorReply):void
		{
			if(err.errorCode < 0)
			{
				// Network error
				this.shutdown();
			}

			if(err.errorCode == 2) // Bad auth
			{
				this.setUserInfo(null);
				this.shutdown();
			}
			else if(err.errorCode == 19)
			{
				this.shutdown();
			}

			if(this.GlobalErrorHandler != null)
				this.GlobalErrorHandler(err);
		}
		
		_onServerNotification(notificationType:string, notificationJson:string):void
		{
			var notification:Object = JSON.parse(notificationJson);

			switch(notificationType)
			{
				case "error":
					// Pushed error
					this._onServerError(<ErrorReply>notification);
					return;
				case "msg":
					// User message
					this._onUserMessage(<UserMessageNotification>notification);
					return;
				case "resJoined":
					if(this.ResidentJoinedHandler)
						this.ResidentJoinedHandler(<ResidentJoinedNotification>notification);
					return;
				case "resLeft":
					if(this.ResidentLeftHandler)
						this.ResidentLeftHandler(<ResidentLeftNotification>notification);
					return;
				case "resEvent":
					if(this.ResidentEventHandler)
						this.ResidentEventHandler(<ResidentEventNotification>notification);
					return;
				case "resUpdate":
					if(this.ResidentStateUpdateHandler)
						this.ResidentStateUpdateHandler(<ResidentStateUpdateNotification>notification);
					return;
				default:
					console.log("Unknown type of server notification: "+notificationType);
					return;
			}	
		}

		_onUserMessage(message:UserMessageNotification):void
		{
			var typeHandler:ServerMessageTypeHandler = this.UserMessageTypeHandlers[message.message_type];
			if(typeHandler != null)
			{
				typeHandler(message);
			}
			else if(this.UserMessageHandler != null)
			{
				this.UserMessageHandler(message);
			}
			else
			{
				console.log("No handler for message "+message.message_type);
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
			},
			function(err:ErrorReply):void
			{
				if(err.errorCode <= 0)
				{
					// Network error, stop pinging until we make another real request
					self.shutdown();
				}
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
			var self:Serverville = this;
			this.Transport.callApi(api,
				request,
				function(reply:Object):void
				{
					self.startPingHeartbeat();
					if(onSuccess)
						onSuccess(reply);
				},
				onError
			);

			this.LastSend = performance.now();
		}
        
		// Start generated code -----------------------------------------------------------------------------------

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

		createAnonymousAccount(invite_code:string, language:string, country:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.createAnonymousAccountReq(
				{
					"invite_code":invite_code,
					"language":language,
					"country":country
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

		createAccount(username:string, email:string, password:string, invite_code:string, language:string, country:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.createAccountReq(
				{
					"username":username,
					"email":email,
					"password":password,
					"invite_code":invite_code,
					"language":language,
					"country":country
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

		convertToFullAccount(username:string, email:string, password:string, invite_code:string, language:string, country:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.convertToFullAccountReq(
				{
					"username":username,
					"email":email,
					"password":password,
					"invite_code":invite_code,
					"language":language,
					"country":country
				},
				onSuccess,
				onError
			);
		}

		changePasswordReq(request:ChangePasswordRequest, onSuccess?:(reply:ChangePasswordReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            var self:Serverville = this;
			this.apiByName("ChangePassword",
				request,
				function(reply:ChangePasswordReply):void { self.setUserSession(reply.session_id); if(onSuccess) { onSuccess(reply);} },
				onError
			);
		}

		changePassword(old_password:string, new_password:string, onSuccess?:(reply:ChangePasswordReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.changePasswordReq(
				{
					"old_password":old_password,
					"new_password":new_password
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

		setLocaleReq(request:SetLocaleRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("SetLocale",
				request,
				onSuccess,
				onError
			);
		}

		setLocale(country:string, language:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setLocaleReq(
				{
					"country":country,
					"language":language
				},
				onSuccess,
				onError
			);
		}

		getUserDataComboReq(request:GetUserDataComboRequest, onSuccess?:(reply:GetUserDataComboReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetUserDataCombo",
				request,
				onSuccess,
				onError
			);
		}

		getUserDataCombo(since:number, onSuccess?:(reply:GetUserDataComboReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getUserDataComboReq(
				{
					"since":since
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

		setAndDeleteUserKeysReq(request:UserDataSetAndDeleteRequestList, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("SetAndDeleteUserKeys",
				request,
				onSuccess,
				onError
			);
		}

		setAndDeleteUserKeys(values:Array<SetUserDataRequest>, delete_keys:Array<string>, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setAndDeleteUserKeysReq(
				{
					"values":values,
					"delete_keys":delete_keys
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

		deleteUserKeyReq(request:DeleteKeyRequest, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("DeleteUserKey",
				request,
				onSuccess,
				onError
			);
		}

		deleteUserKey(key:string, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.deleteUserKeyReq(
				{
					"key":key
				},
				onSuccess,
				onError
			);
		}

		deleteUserKeysReq(request:DeleteKeysRequest, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("DeleteUserKeys",
				request,
				onSuccess,
				onError
			);
		}

		deleteUserKeys(keys:Array<string>, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.deleteUserKeysReq(
				{
					"keys":keys
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

		pageAllDataKeysReq(request:PageGlobalKeysRequest, onSuccess?:(reply:OrderedDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("PageAllDataKeys",
				request,
				onSuccess,
				onError
			);
		}

		pageAllDataKeys(id:string, page_size:number, start_after:string, descending:boolean, onSuccess?:(reply:OrderedDataReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.pageAllDataKeysReq(
				{
					"id":id,
					"page_size":page_size,
					"start_after":start_after,
					"descending":descending
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

		getKeyDataRecordsReq(request:KeyDataRecordsRequest, onSuccess?:(reply:KeyDataRecords)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetKeyDataRecords",
				request,
				onSuccess,
				onError
			);
		}

		getKeyDataRecords(record_type:string, parent:string, onSuccess?:(reply:KeyDataRecords)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getKeyDataRecordsReq(
				{
					"record_type":record_type,
					"parent":parent
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

		getHostWithResidentReq(request:GetHostWithResidentRequest, onSuccess?:(reply:GetHostWithResidentReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetHostWithResident",
				request,
				onSuccess,
				onError
			);
		}

		getHostWithResident(resident_id:string, onSuccess?:(reply:GetHostWithResidentReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getHostWithResidentReq(
				{
					"resident_id":resident_id
				},
				onSuccess,
				onError
			);
		}

		createResidentReq(request:CreateResidentRequest, onSuccess?:(reply:CreateResidentReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("CreateResident",
				request,
				onSuccess,
				onError
			);
		}

		createResident(resident_type:string, values:{[key:string]:any}, onSuccess?:(reply:CreateResidentReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.createResidentReq(
				{
					"resident_type":resident_type,
					"values":values
				},
				onSuccess,
				onError
			);
		}

		deleteResidentReq(request:DeleteResidentRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("DeleteResident",
				request,
				onSuccess,
				onError
			);
		}

		deleteResident(resident_id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.deleteResidentReq(
				{
					"resident_id":resident_id,
					"final_values":final_values
				},
				onSuccess,
				onError
			);
		}

		removeResidentFromAllChannelsReq(request:RemoveResidentFromAllChannelsRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("RemoveResidentFromAllChannels",
				request,
				onSuccess,
				onError
			);
		}

		removeResidentFromAllChannels(resident_id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.removeResidentFromAllChannelsReq(
				{
					"resident_id":resident_id,
					"final_values":final_values
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

		setTransientValue(resident_id:string, key:string, value:any, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setTransientValueReq(
				{
					"resident_id":resident_id,
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

		setTransientValues(resident_id:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.setTransientValuesReq(
				{
					"resident_id":resident_id,
					"values":values
				},
				onSuccess,
				onError
			);
		}

		deleteTransientValueReq(request:DeleteTransientValueRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("DeleteTransientValue",
				request,
				onSuccess,
				onError
			);
		}

		deleteTransientValue(resident_id:string, key:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.deleteTransientValueReq(
				{
					"resident_id":resident_id,
					"key":key
				},
				onSuccess,
				onError
			);
		}

		deleteTransientValuesReq(request:DeleteTransientValuesRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("DeleteTransientValues",
				request,
				onSuccess,
				onError
			);
		}

		deleteTransientValues(resident_id:string, values:Array<string>, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.deleteTransientValuesReq(
				{
					"resident_id":resident_id,
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

		getTransientValue(resident_id:string, key:string, onSuccess?:(reply:TransientDataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getTransientValueReq(
				{
					"resident_id":resident_id,
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

		getTransientValues(resident_id:string, keys:Array<string>, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getTransientValuesReq(
				{
					"resident_id":resident_id,
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

		getAllTransientValues(resident_id:string, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getAllTransientValuesReq(
				{
					"resident_id":resident_id
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

		joinChannel(channel_id:string, resident_id:string, values:{[key:string]:any}, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.joinChannelReq(
				{
					"channel_id":channel_id,
					"resident_id":resident_id,
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

		leaveChannel(channel_id:string, resident_id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.leaveChannelReq(
				{
					"channel_id":channel_id,
					"resident_id":resident_id,
					"final_values":final_values
				},
				onSuccess,
				onError
			);
		}

		addResidentToChannelReq(request:JoinChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("AddResidentToChannel",
				request,
				onSuccess,
				onError
			);
		}

		addResidentToChannel(channel_id:string, resident_id:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.addResidentToChannelReq(
				{
					"channel_id":channel_id,
					"resident_id":resident_id,
					"values":values
				},
				onSuccess,
				onError
			);
		}

		removeResidentFromChannelReq(request:LeaveChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("RemoveResidentFromChannel",
				request,
				onSuccess,
				onError
			);
		}

		removeResidentFromChannel(channel_id:string, resident_id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.removeResidentFromChannelReq(
				{
					"channel_id":channel_id,
					"resident_id":resident_id,
					"final_values":final_values
				},
				onSuccess,
				onError
			);
		}

		listenToChannelReq(request:ListenToChannelRequest, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("ListenToChannel",
				request,
				onSuccess,
				onError
			);
		}

		listenToChannel(channel_id:string, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.listenToChannelReq(
				{
					"channel_id":channel_id
				},
				onSuccess,
				onError
			);
		}

		stopListenToChannelReq(request:StopListenToChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("StopListenToChannel",
				request,
				onSuccess,
				onError
			);
		}

		stopListenToChannel(channel_id:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.stopListenToChannelReq(
				{
					"channel_id":channel_id
				},
				onSuccess,
				onError
			);
		}

		triggerResidentEventReq(request:TriggerResidentEventRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("TriggerResidentEvent",
				request,
				onSuccess,
				onError
			);
		}

		triggerResidentEvent(resident_id:string, event_type:string, event_data:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.triggerResidentEventReq(
				{
					"resident_id":resident_id,
					"event_type":event_type,
					"event_data":event_data
				},
				onSuccess,
				onError
			);
		}

		sendUserMessageReq(request:SendUserMessageRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("SendUserMessage",
				request,
				onSuccess,
				onError
			);
		}

		sendUserMessage(to:string, message_type:string, message:string, guaranteed:boolean, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.sendUserMessageReq(
				{
					"to":to,
					"message_type":message_type,
					"message":message,
					"guaranteed":guaranteed
				},
				onSuccess,
				onError
			);
		}

		getPendingMessagesReq(request:EmptyClientRequest, onSuccess?:(reply:UserMessageList)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetPendingMessages",
				request,
				onSuccess,
				onError
			);
		}

		getPendingMessages(onSuccess?:(reply:UserMessageList)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getPendingMessagesReq(
				{

				},
				onSuccess,
				onError
			);
		}

		clearPendingMessageReq(request:ClearMessageRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("ClearPendingMessage",
				request,
				onSuccess,
				onError
			);
		}

		clearPendingMessage(id:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.clearPendingMessageReq(
				{
					"id":id
				},
				onSuccess,
				onError
			);
		}

		getCurrencyBalanceReq(request:CurrencyBalanceRequest, onSuccess?:(reply:CurrencyBalanceReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetCurrencyBalance",
				request,
				onSuccess,
				onError
			);
		}

		getCurrencyBalance(currency_id:string, onSuccess?:(reply:CurrencyBalanceReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getCurrencyBalanceReq(
				{
					"currency_id":currency_id
				},
				onSuccess,
				onError
			);
		}

		getCurrencyBalancesReq(request:EmptyClientRequest, onSuccess?:(reply:CurrencyBalancesReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetCurrencyBalances",
				request,
				onSuccess,
				onError
			);
		}

		getCurrencyBalances(onSuccess?:(reply:CurrencyBalancesReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getCurrencyBalancesReq(
				{

				},
				onSuccess,
				onError
			);
		}

		getProductsReq(request:GetProductsRequest, onSuccess?:(reply:ProductInfoList)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetProducts",
				request,
				onSuccess,
				onError
			);
		}

		getProducts(onSuccess?:(reply:ProductInfoList)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getProductsReq(
				{

				},
				onSuccess,
				onError
			);
		}

		getProductReq(request:GetProductRequest, onSuccess?:(reply:ProductInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("GetProduct",
				request,
				onSuccess,
				onError
			);
		}

		getProduct(product_id:string, onSuccess?:(reply:ProductInfo)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.getProductReq(
				{
					"product_id":product_id
				},
				onSuccess,
				onError
			);
		}

		stripeCheckoutReq(request:StripeCheckoutRequest, onSuccess?:(reply:ProductPurchasedReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
            
			this.apiByName("stripeCheckout",
				request,
				onSuccess,
				onError
			);
		}

		stripeCheckout(stripe_token:string, product_id:string, onSuccess?:(reply:ProductPurchasedReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.stripeCheckoutReq(
				{
					"stripe_token":stripe_token,
					"product_id":product_id
				},
				onSuccess,
				onError
			);
		}


        
        
	}

		
}