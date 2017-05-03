namespace sv
{
    export interface ErrorReply
    {
        errorCode:number;
        errorMessage:string;
        errorDetails:string;
    }
    
    export function makeClientError(code:number, details:string=null):ErrorReply
    {
        var msg:string = "Unknown network error";
        switch(code)
        {
            case -1:
                msg = "Connection closed";
                break;
            case -2:
                msg = "Network error";
                break;
        }
        
        return {errorCode:code, errorMessage:msg, errorDetails:details};
    }
    
    export interface ServervilleTransport
	{
        init(onConnected:(err:ErrorReply)=>void):void;
        callApi(api:string, request:Object, onSuccess:(reply:Object)=>void, onError:(reply:ErrorReply)=>void):void;
        close():void;
    }

    export interface TransientValuesChangeMessage
    {
        values:{[key:string]:any};
        deleted:string[];
    }

    export interface TransientClientMessage
    {
        message_type:string;
        value:any;
    }
    
}