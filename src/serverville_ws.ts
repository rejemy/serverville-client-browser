/// <reference path="serverville_types.ts" />

namespace sv
{
    type ServervilleWSReplyHandler = (isError:boolean, msg:Object)=>void;
    
    export class WebSocketTransport
	{
        SV:Serverville;
        
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
            
            var self:WebSocketTransport = this;
            
            this.ServerSocket.onopen = function(evt:Event):void
            {
                onConnected(null);
            };
            
            this.ServerSocket.onclose = function(evt:CloseEvent):void
            {
                self.onWSClosed(evt);
            }
            
            this.ServerSocket.onmessage = function(evt:MessageEvent):void
            {
                self.onWSMessage(evt);
            }
            
            this.ServerSocket.onerror = function(evt:ErrorEvent):void
            {
                if(onConnected != null)
                {
                    onConnected(makeClientError(1));               
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
                    if(self.GlobalErrorHandler)
						self.GlobalErrorHandler(<ErrorReply>reply);
                    if(onError)
                        onError(<ErrorReply>reply);
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
        
        private onWSClosed(evt:CloseEvent):void
		{
			console.log("Web socket closed");
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
                
                var messageId:string = messageStr.substring(split1+1, split2);
                var messageFrom:string = messageStr.substring(split2+1, split3);
                var messageJson:string = messageStr.substring(split3+1);
                var messageData:Object = JSON.parse(messageJson);
                
                /*if(this.ServerMessageHandler != null)
                {
                    var handler:ServervilleMessageHandler = this.ServerMessageHandler[messageId];
                    if(handler == null)
                    {
                        console.log("No handler for message of type "+messageId);
                        return;
                    }
                    
                    handler(messageFrom, messageData);
                }*/
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