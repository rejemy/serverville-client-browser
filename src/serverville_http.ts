/// <reference path="serverville_types.ts" />

namespace sv
{
    interface MessageEnvelope
	{
		message:Object;
	}
    
    export class HttpTransport implements ServervilleTransport
	{
        SV:Serverville;
        
        public constructor(sv:Serverville)
        {
            this.SV = sv;
        }
        
        public init(onConnected:(err:ErrorReply)=>void)
        {
            if(onConnected != null)
                onConnected(null);
        }
        
        public callApi(api:string, request:Object, onSuccess:(reply:Object)=>void, onError:(reply:ErrorReply)=>void):void
        {
            var req:XMLHttpRequest = new XMLHttpRequest();
			req.open("POST", this.SV.ServerURL+"/api/"+api);
			if(this.SV.SessionId)
				req.setRequestHeader("Authorization", this.SV.SessionId);
			req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			var body:string = JSON.stringify(request);
			
            if(this.SV.LogMessagesToConsole)
                console.log("HTTP<- "+body);
            
			var self:Serverville = this.SV;
			
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
                    var error:ErrorReply = JSON.parse(req.response);
					if(self.GlobalErrorHandler)
						self.GlobalErrorHandler(error);
					if(onError)
						onError(error);
				}
				
			};
			
			req.onerror = function(ev:Event):void
			{
                var err:ErrorReply = makeClientError(1);
                
				if(self.GlobalErrorHandler)
					self.GlobalErrorHandler(err);
				if(onError)
					onError(err);
			};
			
			req.send(body);
        }
    }
}