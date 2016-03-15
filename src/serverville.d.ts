declare namespace sv
{
    export interface ErrorReply
    {
        errorCode:number;
        errorMessage:string;
        errorDetails:string;
    }
   
	export interface SignIn
	{
		username:string;
		email:string;
		password:string;
	}

	export interface UserAccountInfo
	{
		user_id:string;
		username:string;
		email:string;
		session_id:string;
	}

	export interface ValidateSessionRequest
	{
		session_id:string;
	}

	export interface CreateAnonymousAccount
	{
	}

	export interface CreateAccount
	{
		username:string;
		email:string;
		password:string;
	}

	export interface GetUserInfo
	{
	}

	export namespace JsonDataType
	{
		export const NULL:JsonDataTypeEnum;
		export const BOOLEAN:JsonDataTypeEnum;
		export const NUMBER:JsonDataTypeEnum;
		export const STRING:JsonDataTypeEnum;
		export const JSON:JsonDataTypeEnum;
		export const XML:JsonDataTypeEnum;
		export const DATETIME:JsonDataTypeEnum;
		export const BYTES:JsonDataTypeEnum;
		export const OBJECT:JsonDataTypeEnum;
	}

	export type JsonDataTypeEnum =
		"null" |
		"boolean" |
		"number" |
		"string" |
		"json" |
		"xml" |
		"datetime" |
		"bytes" |
		"object";

	export interface SetUserDataRequest
	{
		key:string;
		value:any;
		data_type:JsonDataTypeEnum;
	}

	export interface SetDataReply
	{
		updated_at:number;
	}

	export interface UserDataRequestList
	{
		values:Array<SetUserDataRequest>;
	}

	export interface KeyRequest
	{
		key:string;
	}

	export interface DataItemReply
	{
		id:string;
		key:string;
		value:any;
		data_type:JsonDataTypeEnum;
		created:number;
		modified:number;
		deleted:boolean;
	}

	export interface KeysRequest
	{
		keys:Array<string>;
		since:number;
	}

	export interface UserDataReply
	{
		values:{[key:string]:DataItemReply};
	}

	export interface AllKeysRequest
	{
		since:number;
	}

	export interface GlobalKeyRequest
	{
		id:string;
		key:string;
	}

	export interface GlobalKeysRequest
	{
		id:string;
		keys:Array<string>;
		since:number;
		include_deleted:boolean;
	}

	export interface AllGlobalKeysRequest
	{
		id:string;
		since:number;
		include_deleted:boolean;
	}

	export interface SetTransientValueRequest
	{
		key:string;
		value:any;
		data_type:JsonDataTypeEnum;
	}

	export interface EmptyClientReply
	{
	}

	export interface SetTransientValuesRequest
	{
		values:Array<SetTransientValueRequest>;
	}

	export interface GetTransientValueRequest
	{
		id:string;
		key:string;
	}

	export interface GetTransientValuesRequest
	{
		id:string;
		keys:Array<string>;
	}

	export interface GetAllTransientValuesRequest
	{
		id:string;
	}

	export interface JoinChannelRequest
	{
		id:string;
		listen_only:boolean;
	}

	export interface ChannelInfo
	{
		id:string;
		members:Array<string>;
	}

	export interface LeaveChannelRequest
	{
		id:string;
	}

	export interface TransientMessageRequest
	{
		to:string;
		message_type:string;
		value:any;
		data_type:JsonDataTypeEnum;
	}



	type ServerMessageTypeHandler = (from:string, msg:Object)=>void;
	
    export class Serverville
	{
        ServerURL:string;
		SessionId:string;
        LogMessagesToConsole:boolean;
		GlobalErrorHandler:(ev:ErrorReply)=>void;
        ServerMessageTypeHandlers:{[id:string]:ServerMessageTypeHandler};
		ServerMessageHandler:(messageType:string, from:string, msg:Object)=>void;
		
        constructor(url:string);
        init(onComplete:(user:UserAccountInfo, err:ErrorReply)=>void):void;
        loadUserKeyData(onDone?:()=>void):KeyData;
		loadKeyData(id:string, onDone?:()=>void):KeyData;
		isSignedIn():boolean;
        signOut():void;
		userInfo():UserAccountInfo;
		
		apiByName(api:string, request:Object, onSuccess:(reply:Object)=>void, onError?:(reply:ErrorReply)=>void):void;
		signInReq(request:SignIn, onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		signIn(username:string, email:string, password:string, onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		validateSessionReq(request:ValidateSessionRequest, onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		validateSession(session_id:string, onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		createAnonymousAccountReq(request:CreateAnonymousAccount, onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		createAnonymousAccount(onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		createAccountReq(request:CreateAccount, onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		createAccount(username:string, email:string, password:string, onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		convertToFullAccountReq(request:CreateAccount, onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		convertToFullAccount(username:string, email:string, password:string, onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserInfoReq(request:GetUserInfo, onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserInfo(onSuccess:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		setUserKeyReq(request:SetUserDataRequest, onSuccess:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setUserKey(key:string, value:any, data_type:JsonDataTypeEnum, onSuccess:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setUserKeysReq(request:UserDataRequestList, onSuccess:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setUserKeys(values:Array<SetUserDataRequest>, onSuccess:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserKeyReq(request:KeyRequest, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserKey(key:string, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserKeysReq(request:KeysRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserKeys(keys:Array<string>, since:number, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllUserKeysReq(request:AllKeysRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllUserKeys(since:number, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getDataKeyReq(request:GlobalKeyRequest, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getDataKey(id:string, key:string, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getDataKeysReq(request:GlobalKeysRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getDataKeys(id:string, keys:Array<string>, since:number, include_deleted:boolean, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllDataKeysReq(request:AllGlobalKeysRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllDataKeys(id:string, since:number, include_deleted:boolean, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValueReq(request:SetTransientValueRequest, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValue(key:string, value:any, data_type:JsonDataTypeEnum, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValuesReq(request:SetTransientValuesRequest, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValues(values:Array<SetTransientValueRequest>, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValueReq(request:GetTransientValueRequest, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValue(id:string, key:string, onSuccess:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValuesReq(request:GetTransientValuesRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValues(id:string, keys:Array<string>, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllTransientValuesReq(request:GetAllTransientValuesRequest, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllTransientValues(id:string, onSuccess:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getChannelInfoReq(request:JoinChannelRequest, onSuccess:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		getChannelInfo(id:string, listen_only:boolean, onSuccess:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		joinChannelReq(request:JoinChannelRequest, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		joinChannel(id:string, listen_only:boolean, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		leaveChannelReq(request:LeaveChannelRequest, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		leaveChannel(id:string, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		sendClientMessageReq(request:TransientMessageRequest, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		sendClientMessage(to:string, message_type:string, value:any, data_type:JsonDataTypeEnum, onSuccess:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;


    }
    
    export class KeyData
	{
        id:string;
		server:Serverville;
		data:any;
        
		constructor(server:Serverville, id:string);
		loadAll(onDone?:()=>void):void;
		refresh(onDone?:()=>void):void;
        set(key:string, val:any):void;
		set(key:string, val:any, data_type:string):void;
		save(onDone?:()=>void):void;
	}
}