/// <reference path="serverville_types.ts" />

namespace sv
{
    type ServervilleWSReplyHandler = (isError:boolean, msg:Object)=>void;
    
    export class WebSocketTransport implements ServervilleTransport
	{
        SV:Serverville;
        Connected:boolean;

        ServerSocket:WebSocket;
		MessageSequence:number = 0;
		ReplyCallbacks:{[id:string]:ServervilleWSReplyHandler} = {};
        
        public constructor(sv:Serverville)
        {
            this.SV = sv;
        }
        
        public init(onConnected:(err:ErrorReply)=>void)
        {
            let url:string = this.SV.ServerURL+"/websocket";
            
            this.ServerSocket = new WebSocket(url);
            this.Connected = false;
            
            let self:WebSocketTransport = this;
            
            this.ServerSocket.onopen = function(evt:Event):void
            {
                self.Connected = true;
                onConnected(null);
            };
            
            this.ServerSocket.onclose = function(evt:CloseEvent):void
            {
                self.onWSClosed(evt);
                self.Connected = false;
            }
            
            this.ServerSocket.onmessage = function(evt:MessageEvent):void
            {
                self.onWSMessage(evt);
            }
            
            this.ServerSocket.onerror = function(evt:ErrorEvent):void
            {
                if(onConnected != null)
                {
                    onConnected(makeClientError(-2, evt.message));               
                }
            };
        }
        
        public callApi(api:string, request:Object, onSuccess:(reply:Object)=>void, onError:(reply:ErrorReply)=>void):void
        {
            let self:WebSocketTransport = this;
            if(this.Connected)
            {
                sendMessage();
            }
            else
            {
                this.init(function(err:ErrorReply):void
                {
                    if(err)
                    {
                        if(onError)
                            onError(err);
                    }
                    else
                    {
                        sendMessage();
                    }
                });
            }

            function sendMessage()
            {
                let messageNum:string = (self.MessageSequence++).toString();
                let message:string = api+":"+messageNum+":"+JSON.stringify(request);
                
                if(self.SV.LogMessagesToConsole)
                    console.log("WS<- "+message);
                
                let callback:ServervilleWSReplyHandler = function(isError:boolean, reply:Object):void
                {
                    if(isError)
                    {
                        if(onError)
                            onError(<ErrorReply>reply);
                        else
                            self.SV._onServerError(<ErrorReply>reply);                
                    }
                    else
                    {
                        if(onSuccess)
                            onSuccess(reply);
                    }
                };
                
                self.ReplyCallbacks[messageNum] = callback;
                
                self.ServerSocket.send(message);
            }
        }     

        public close():void
        {
            this.Connected = false;
            if(this.ServerSocket)
            {
                this.ServerSocket.close();
                this.ServerSocket = null;
            }
        }

        private onWSClosed(evt:CloseEvent):void
		{
            if(this.Connected == false)
            {
                // Ignore close when we never actually got open first
                return;
            }
			console.log("Web socket closed");
            this.Connected = false;
            this.SV._onTransportClosed();
		}
		
		private onWSMessage(evt:MessageEvent):void
		{
			let messageStr:string = evt.data;
            
            if(this.SV.LogMessagesToConsole)
                console.log("WS-> "+messageStr);
            
            let split1:number = messageStr.indexOf(":");
            if(split1 < 1)
            {
                console.log("Incorrectly formatted message");
                return;
            }
            
            let messageType:string = messageStr.substring(0, split1);
            if(messageType == "N")
            {
                // Server push message
                let split2:number = messageStr.indexOf(":", split1+1);
                if(split2 < 0)
                {
                    console.log("Incorrectly formatted message");
                    return;
                }
                
                let notificationType:string = messageStr.substring(split1+1, split2);
                let notificationJson:string = messageStr.substring(split2+1);
				this.SV._onServerNotification(notificationType, notificationJson);
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
                
                let messageNum:string = messageStr.substring(split1+1, split2);
                
                let messageJson:string = messageStr.substring(split2+1);
                let messageData:Object = JSON.parse(messageJson);
                
                let isError:boolean = false;
                if(messageType == "E")
                    isError = true;
                    
                let callback:ServervilleWSReplyHandler = this.ReplyCallbacks[messageNum];
                delete this.ReplyCallbacks[messageNum];
                callback(isError, messageData);
            }
            else
            {
                console.log("Unknown server message: "+messageStr);
            }
 
		}
    }
}