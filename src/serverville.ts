namespace sv
{
	type ServervilleReplyHandler = (isError:boolean, msg:Object)=>void;
	type ServervilleMessageHandler = (from:string, msg:Object)=>void;
    
	export interface SetUserDataInfo
	{
		key:string,
		value:any,
		data_type?:string
	}
	
	export interface DataItemInfo
	{
		id:string;
		key:string;
		value:any;
		data_type:string;
		created:number;
		modified:number;
		deleted?:boolean;
	}
	
	export interface DataItemsReply
	{
		values:{[key:string]:DataItemInfo};
	}
	
	export interface SignInReply
	{
		username:string;
		email:string;
		user_id:string;
		session_id:string;
	}
	
	export interface SetDataReply
	{
		updated_at:number;
	}
	
	export interface KeyRequestOptions
	{
		since?:number;
		include_deleted?:boolean;
	}
	
	interface MessageEnvelope
	{
		message:Object;
	}
    
    export interface ErrorReply
    {
        errorCode:number;
        errorMessage:string;
        errorDetails:string;
    }
	
	export class Serverville
	{
		ServerURL:string;

		SessionId:string;
		UserInfo:SignInReply;
		
		GlobalErrorHandler:(ev:Event)=>void;
		
		ServerSocket:WebSocket;
		MessageSequence:number = 0;
		ReplyCallbacks:{[id:number]:ServervilleReplyHandler} = {};
		
        ServerMessageHandler:any;
        
        LogMessagesToConsole:boolean = false;
        
		constructor(url:string)
		{
			this.ServerURL = url;
			this.SessionId = localStorage.getItem("SessionId");
 
		}
		
		init(onComplete:(user:SignInReply)=>void):void
		{
			var self:Serverville = this;
			
			if(this.usingWebsocket())
			{
				this.ServerSocket = new WebSocket(this.ServerURL);
				
				this.ServerSocket.onopen = function(evt:Event):void
				{
					if(self.SessionId)
					{
						self.validateSession(self.SessionId, onComplete, function(reply:Object):void
						{
							self.signOut();
							onComplete(null);
						});
					}
					else
					{
						onComplete(null);
					}
				};
				this.ServerSocket.onclose = function(evt:CloseEvent):void
				{
					self.onWSClosed(evt);
				};
				this.ServerSocket.onmessage = function(evt:MessageEvent):void
				{
					self.onWSMessage(evt);
				};
				this.ServerSocket.onerror = function(evt:ErrorEvent):void
				{
					onComplete(null);
				};
		
				return;
			}

			if(this.SessionId)
			{
				this.getUserInfo(onComplete, function(reply:Object):void
				{
					self.signOut();
					onComplete(null);
				});
			}
			else
			{
				onComplete(null);
			}
		}
		
		private onWSClosed(evt:CloseEvent):void
		{
			console.log("Web socket closed");
		}
		
		private onWSMessage(evt:MessageEvent):void
		{
			var messageStr:string = evt.data;
            
            if(this.LogMessagesToConsole)
                console.log("WS-> "+messageStr);
            
            var split1:number = messageStr.indexOf(":");
            if(split1 < 0)
            {
                console.log("Incorrectly formatted message");
                return;
            }
            
            var messageType:string = messageStr.substring(0, split1);
            if(messageType == "M")
            {
                // Server push message
                var split2:number = messageStr.indexOf(":", split1+1);
                if(split2 < 0)
                {
                    console.log("Incorrectly formatted message");
                    return;
                }
                var split3:number = messageStr.indexOf(":", split2+1);
                if(split3 < 0)
                {
                    console.log("Incorrectly formatted message");
                    return;
                }
                
                var messageId:string = messageStr.substring(split1+1, split2);
                var messageFrom:string = messageStr.substring(split2+1, split3);
                var messageJson:string = messageStr.substring(split3+1);
                var messageData:Object = JSON.parse(messageJson);
                
                if(this.ServerMessageHandler != null)
                {
                    var handler:ServervilleMessageHandler = this.ServerMessageHandler[messageId];
                    if(handler == null)
                    {
                        console.log("No handler for message of type "+messageId);
                        return;
                    }
                    
                    handler(messageFrom, messageData);
                }
            }
            else if(messageType == "E" || messageType == "R")
            {
                // Reply
                var split2:number = messageStr.indexOf(":", split1+1);
                if(split2 < 0)
                {
                    console.log("Incorrectly formatted message");
                    return;
                }
                
                var messageNum:number = parseInt(messageStr.substring(split1+1, split2));
                
                var messageJson:string = messageStr.substring(split2+1);
                var messageData:Object = JSON.parse(messageJson);
                
                var isError:boolean = false;
                if(messageType == "E")
                    isError = true;
                    
                var callback:ServervilleReplyHandler = this.ReplyCallbacks[messageNum];
                delete this.ReplyCallbacks[messageNum];
                callback(isError, messageData);
            }
            else
            {
                console.log("Unknown server message: "+messageStr);
            }
 
		}
		
		private usingWebsocket():boolean
		{
			return this.ServerURL.substr(0, 5) == "ws://";
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
		
		private callJsonApi(api:string, request:Object, onSuccess:(reply:Object)=>void, onError:(reply:Object)=>void):void
		{
			if(this.ServerSocket)
			{
				this.callWSJsonApi(api, request, onSuccess, onError);
			}
			else
			{
				this.callHTTPJsonApi(api, request, onSuccess, onError);
			}
		}
		
		private callHTTPJsonApi(api:string, request:Object, onSuccess:(reply:Object)=>void, onError:(reply:Object)=>void):void
		{
			var req:XMLHttpRequest = new XMLHttpRequest();
			req.open("POST", this.ServerURL+"/api/"+api);
			if(this.SessionId)
				req.setRequestHeader("Authorization", this.SessionId);
			req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			var body:string = JSON.stringify(request);
			
            if(this.LogMessagesToConsole)
                console.log("HTTP<- "+body);
            
			var self:Serverville = this;
			
			req.onload = function(ev:Event):void
			{
                if(this.LogMessagesToConsole)
                    console.log("HTTP-> "+req.response);
                
				if (req.status >= 200 && req.status < 400)
				{
					var envelope:MessageEnvelope = JSON.parse(req.response);
					if(onSuccess)
					{
						onSuccess(envelope.message);
					}
				}
				else
				{
					if(self.GlobalErrorHandler)
						self.GlobalErrorHandler(null);
					if(onError)
						onError(null);
				}
				
			};
			
			req.onerror = function(ev:Event):void
			{
				if(self.GlobalErrorHandler)
					self.GlobalErrorHandler(ev);
				if(onError)
					onError(ev);
			};
			
			req.send(body);
		}
		
		private callWSJsonApi(api:string, request:Object, onSuccess:(reply:Object)=>void, onError:(reply:Object)=>void):void
		{
            var messageNum:number = this.MessageSequence++;
			var message:string = api+":"+messageNum.toString()+":"+JSON.stringify(request);
            
            if(this.LogMessagesToConsole)
                console.log("WS<- "+message);
            
            var callback:ServervilleReplyHandler = function(isError:boolean, reply:Object):void
            {
                if(isError)
                {
                    if(onError)
                        onError(reply);
                }
                else
                {
                    if(onSuccess)
                        onSuccess(reply);
                }
            };
            
            this.ReplyCallbacks[messageNum] = callback;
            
			this.ServerSocket.send(message);
		}
		
		isSignedIn():boolean
		{
			return this.SessionId != null;
		}
		
		validateSession(session_id:string, onSuccess:(reply:SignInReply)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("ValidateSession",
				{
					"session_id":session_id
				},
				function(reply:SignInReply):void
				{
					self.setUserInfo(reply);
					
					if(onSuccess)
						onSuccess(reply);
				},
				onError
			);
		}
		
		signIn(username:string, email:string, password:string, onSuccess:(reply:SignInReply)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("SignIn",
				{
					"username":username,
					"email":email,
					"password":password
				},
				function(reply:SignInReply):void
				{
					self.setUserInfo(reply);
					
					if(onSuccess)
						onSuccess(reply);
				},
				onError
			);
		}
		
		signOut():void
		{
			this.setUserInfo(null);
		}
		
		createAccount(username:string, email:string, password:string, onSuccess:(reply:SignInReply)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("CreateAccount",
				{
					"username":username,
					"email":email,
					"password":password
				},
				function(reply:SignInReply):void
				{
					self.setUserInfo(reply);
					
					if(onSuccess)
						onSuccess(reply);
				},
				onError
			);
		}
		
		createAnonymousAccount(onSuccess:(reply:SignInReply)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("CreateAnonymousAccount",
				{
				},
				function(reply:SignInReply):void
				{
					self.setUserInfo(reply);
					
					if(onSuccess)
						onSuccess(reply);
				},
				onError
			);
		}
		
		convertToFullAccount(username:string, email:string, password:string, onSuccess:(reply:SignInReply)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("ConvertToFullAccount",
				{
					"username":username,
					"email":email,
					"password":password
				},
				function(reply:SignInReply):void
				{
					self.setUserInfo(reply);
					
					if(onSuccess)
						onSuccess(reply);
				},
				onError
			);
		}
		
		getUserInfo(onSuccess:(reply:SignInReply)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("GetUserInfo",
				{},
				function(reply:SignInReply):void
				{
					self.setUserInfo(reply);
					
					if(onSuccess)
						onSuccess(reply);
				},
				onError
			);
		}
		
		setUserKey(request:SetUserDataInfo, onSuccess:(reply:SetDataReply)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("SetUserKey",
				request,
				onSuccess, onError
			);
		}
		
		setUserKeys(values:SetUserDataInfo[], onSuccess:(reply:SetDataReply)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("SetUserKeys",
				{
					"values":values
				},
				onSuccess, onError
			);
		}
		
		getUserKey(key:string, onSuccess:(reply:DataItemInfo)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("GetUserKey",
				{
					"key":key
				},
				onSuccess, onError
			);
		}
		
		getUserKeys(keys:string[], since:number, onSuccess:(reply:DataItemsReply)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("GetUserKeys",
				{
					"keys":keys,
					"since":since
				},
				onSuccess, onError
			);
		}
		
		getAllUserKeys(since:number, onSuccess:(reply:DataItemsReply)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("GetAllUserKeys",
				{
					"since":since
				},
				onSuccess, onError
			);
		}
		
		getDataKey(id:string, key:string, onSuccess:(reply:DataItemInfo)=>void, onError?:(reply:Object)=>void):void
		{
			var self:Serverville = this;
			this.callJsonApi("GetDataKey",
				{
					"id":id,
					"key":key
				},
				onSuccess, onError
			);
		}
		
		getDataKeys(id:string, keys:string[], options:KeyRequestOptions, onSuccess:(reply:DataItemsReply)=>void, onError?:(reply:Object)=>void):void
		{
			if(options == null) options = {};
			var self:Serverville = this;
			this.callJsonApi("GetDataKeys",
				{
					"id":id,
					"keys":keys,
					"since":options.since,
					"include_deleted":options.include_deleted
				},
				onSuccess, onError
			);
		}
		
		getAllDataKeys(id:string, options:KeyRequestOptions, onSuccess:(reply:DataItemsReply)=>void, onError?:(reply:Object)=>void):void
		{
			if(options == null) options = {};
			var self:Serverville = this;
			this.callJsonApi("GetAllDataKeys",
				{
					"id":id,
					"since":options.since,
					"include_deleted":options.include_deleted
				},
				onSuccess, onError
			);
		}
        
        customApi(apiName:string, message:Object, onSuccess:(reply:Object)=>void, onError?:(reply:Object)=>void):void
        {
            this.callJsonApi(apiName,
				message,
				onSuccess, onError
			);
        }
        
	}
	

		
	export class KeyData
	{
		id:string;
		server:Serverville;
		data:any;
		data_info:{[key:string]:DataItemInfo};
		local_dirty:{[key:string]:DataItemInfo};
		most_recent:number;
		
		constructor(server:Serverville, id:string)
		{
			if(server == null)
				throw "Must supply a serverville server";
			if(id == null)
				throw "Data must have an id";
			this.id = id;
			this.server = server;
			this.data = {};
			this.data_info = {};
			this.local_dirty = {};
			
			this.most_recent = 0;
		}
		
		loadAll(onDone?:()=>void):void
		{
			this.data = {};
			this.local_dirty = {};
			
			var self:KeyData = this;
			this.server.getAllDataKeys(this.id, {"include_deleted":true},
				function(reply:DataItemsReply):void
				{
					self.data_info = reply.values;
					
					for(var key in self.data_info)
					{
						var dataInfo:DataItemInfo = self.data_info[key];
						self.data[key] = dataInfo.value;
						if(dataInfo.modified > self.most_recent)
							self.most_recent = dataInfo.modified;
					}
					
					if(onDone)
						onDone();
				},
				function(reply:Object):void
				{
					if(onDone)
						onDone();
				}
			);
			
		}
		
		refresh(onDone?:()=>void):void
		{
			var self:KeyData = this;
			this.server.getAllDataKeys(this.id, {"include_deleted":true, "since":this.most_recent},
				function(reply:DataItemsReply):void
				{
					self.data_info = reply.values;
					
					for(var key in self.data_info)
					{
						var dataInfo:DataItemInfo = self.data_info[key];
						if(dataInfo.deleted)
						{
							delete self.data[key];
						}
						else
						{
							self.data[key] = dataInfo.value;
						}
						
						if(dataInfo.modified > self.most_recent)
							self.most_recent = dataInfo.modified;
					}
					
					if(onDone)
						onDone();
				},
				function(reply:Object):void
				{
					if(onDone)
						onDone();
				}
			);

		}
		
		set(key:string, val:any, data_type:string = null):void
		{
			if(this.server.UserInfo == null || this.server.UserInfo.user_id != this.id)
				throw "Read-only data!";
				
			this.data[key] = val;
			var info:DataItemInfo = this.data_info[key];
			if(info)
			{
				info.value = val;
				if(data_type)
					info.data_type = data_type;
				if(info.deleted)
					delete info.deleted;
			}
			else
			{
				info = {
					"id":this.id,
					"key":key,
					"value":val,
					"data_type":data_type,
					"created":0,
					"modified":0
				};
				this.data_info[key] = info;
			}
			this.local_dirty[key] = info;
		}
		
		save(onDone?:()=>void):void
		{
			if(this.server.UserInfo == null || this.server.UserInfo.user_id != this.id)
				throw "Read-only data!";
				
			var saveSet:SetUserDataInfo[] = [];
			
			for(var key in this.local_dirty)
			{
				var info:DataItemInfo = this.local_dirty[key];
	
				saveSet.push(
					{
						"key":info.key,
						"value":info.value,
						"data_type":info.data_type
					}
				);
			}
			
			this.server.setUserKeys(saveSet,
				function(reply:SetDataReply):void
				{
					this.local_dirty = {};
					
					if(onDone)
						onDone();
				},
				function(reply:Object):void
				{
					if(onDone)
						onDone();
				}
			);

			
		}
	}
}