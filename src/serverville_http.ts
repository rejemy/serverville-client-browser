/// <reference path="serverville_types.ts" />

namespace sv
{
    export class HttpTransport implements ServervilleTransport
	{
        SV:Serverville;
        
        constructor(sv:Serverville)
        {
            this.SV = sv;
        }
        
        init(onConnected:(err:ErrorReply)=>void)
        {
			this.callApi("GetTime", {},
				function(reply:ServerTime):void
				{
					 if(onConnected != null)
                		onConnected(null);
				},
				onConnected
			);
        }
        
		callApi(api:string, request:Object, onSuccess:(reply:Object)=>void, onError:(reply:ErrorReply)=>void):void
		{
			this.doPost(this.SV.ServerURL+"/api/"+api, request, onSuccess, onError);
		}

        private doPost(url:string, request:Object, onSuccess:(reply:Object)=>void, onError:(reply:ErrorReply)=>void):void
        {
            let req:XMLHttpRequest = new XMLHttpRequest();
			req.open("POST", url);
			if(this.SV.SessionId)
				req.setRequestHeader("Authorization", this.SV.SessionId);
			req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			let body:string = JSON.stringify(request);
			
            if(this.SV.LogMessagesToConsole)
                console.log("HTTP<- "+body);
            
			let self:HttpTransport = this;
			
			req.onload = function(ev:Event):void
			{
                if(self.SV.LogMessagesToConsole)
                    console.log("HTTP-> "+req.response);
                
				if (req.status >= 200 && req.status < 400)
				{
					let message:Object = JSON.parse(req.response);
					if(onSuccess)
					{
						onSuccess(message);
					}
				}
				else
				{
                    let error:ErrorReply = JSON.parse(req.response);
					
					if(onError)
						onError(error);
					else
						self.SV._onServerError(error);
				}

				if(req.getResponseHeader("X-Notifications"))
				{
					// Pending notifications from the server!
					self.getNotifications();
				}
				
			};
			
			req.onerror = function(ev:Event):void
			{
                let err:ErrorReply = makeClientError(-2);
                
				if(onError)
					onError(err);
				else
					self.SV._onServerError(err);
			};
			
			req.send(body);
        }

		close():void
		{
			
		}

		private getNotifications():void
		{
			let url:string = this.SV.ServerURL+"/notifications";
			let self:HttpTransport = this;

			let onSuccess = function(reply:PendingNotificationList):void
			{
				if(!reply.notifications)
					return;

				for(let i:number=0; i<reply.notifications.length; i++)
				{
					let note:PendingNotification = reply.notifications[i];
					self.SV._onServerNotification(note.notification_type, note.body);
				}
			};

			let onError = function(err:ErrorReply):void
			{
				console.log("Error retreiving notifications: "+err.errorMessage);
			};

			this.doPost(url, {}, onSuccess, onError);
		}

		static unauthedRequest(url:string, request:Object, onSuccess:(reply:Object)=>void, onError:(reply:ErrorReply)=>void):void
        {
            let req:XMLHttpRequest = new XMLHttpRequest();
			req.open("POST", url);
			req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			let body:string = JSON.stringify(request);

			req.onload = function(ev:Event):void
			{
				if (req.status >= 200 && req.status < 400)
				{
					let message:Object = JSON.parse(req.response);
					if(onSuccess)
					{
						onSuccess(message);
					}
				}
				else
				{
                    let error:ErrorReply = JSON.parse(req.response);
					
					if(onError)
						onError(error);
				}
				
			};
			
			req.onerror = function(ev:Event):void
			{
                let err:ErrorReply = makeClientError(-2);
                
				if(onError)
					onError(err);
			};
			
			req.send(body);
        }
    }
}