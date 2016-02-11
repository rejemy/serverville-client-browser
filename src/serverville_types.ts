namespace sv
{
    export interface ErrorReply
    {
        errorCode:number;
        errorMessage:string;
        errorDetails:string;
    }
    
    export function makeClientError(code:number):ErrorReply
    {
        var msg:string = "There was an error";
        
        return {errorCode:code, errorMessage:msg, errorDetails:null};
    }
    
    export interface ServervilleTransport
	{
        init(onConnected:(err:ErrorReply)=>void);
        callApi(api:string, request:Object, onSuccess:(reply:Object)=>void, onError:(reply:ErrorReply)=>void):void;
    }
    
}