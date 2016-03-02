/// <reference path="serverville_types.ts" />

namespace sv
{
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
                if(self.LogMessagesToConsole)
                    console.log("HTTP-> "+req.response);
                
				if (req.status >= 200 && req.status < 400)
				{
					var message:Object = JSON.parse(req.response);
					if(onSuccess)
					{
						onSuccess(message);
					}
				}
				else
				{
                    var error:ErrorReply = JSON.parse(req.response);
					self._onServerError(error);
					if(onError)
						onError(error);
				}
				
			};
			
			req.onerror = function(ev:Event):void
			{
                var err:ErrorReply = makeClientError(1);
                
				self._onServerError(err);
				if(onError)
					onError(err);
			};
			
			req.send(body);
        }
    }
}