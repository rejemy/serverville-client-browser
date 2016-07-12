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
            var url:string = this.SV.ServerURL+"/websocket";
            
            this.ServerSocket = new WebSocket(url);
            this.Connected = false;
            
            var self:WebSocketTransport = this;
            
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
            var messageNum:string = (this.MessageSequence++).toString();
			var message:string = api+":"+messageNum+":"+JSON.stringify(request);
            
            if(this.SV.LogMessagesToConsole)
                console.log("WS<- "+message);
            
            var self:Serverville = this.SV;
            
            var callback:ServervilleWSReplyHandler = function(isError:boolean, reply:Object):void
            {
                if(isError)
                {
                    if(onError)
                        onError(<ErrorReply>reply);
                    else
    					self._onServerError(<ErrorReply>reply);                
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

        public close():void
        {
            if(this.ServerSocket)
                this.ServerSocket.close();
        }

        private onWSClosed(evt:CloseEvent):void
		{
            if(this.Connected == false)
            {
                // Ignore close when we never actually got open first
                return;
            }
			console.log("Web socket closed");
            this.SV._onTransportClosed();
		}
		
		private onWSMessage(evt:MessageEvent):void
		{
			var messageStr:string = evt.data;
            
            if(this.SV.LogMessagesToConsole)
                console.log("WS-> "+messageStr);
            
            var split1:number = messageStr.indexOf(":");
            if(split1 < 1)
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
                var split4:number = messageStr.indexOf(":", split3+1);
                if(split4 < 0)
                {
                    console.log("Incorrectly formatted message");
                    return;
                }
                
                var messageType:string = messageStr.substring(split1+1, split2);
                var messageFrom:string = messageStr.substring(split2+1, split3);
                var messageVia:string = messageStr.substring(split3+1, split4);
                var messageJson:string = messageStr.substring(split4+1);
                var messageData:Object = messageJson.length ? JSON.parse(messageJson) : null;
                
				this.SV._onServerMessage(messageType, messageFrom, messageVia, messageData);
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
                
                var messageNum:string = messageStr.substring(split1+1, split2);
                
                var messageJson:string = messageStr.substring(split2+1);
                var messageData:Object = JSON.parse(messageJson);
                
                var isError:boolean = false;
                if(messageType == "E")
                    isError = true;
                    
                var callback:ServervilleWSReplyHandler = this.ReplyCallbacks[messageNum];
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