
// Generated, unfortunately. Edit original template in browser/templates/serverville_messages.ts.tmpl

namespace sv
{

	export interface SignIn
	{
		username:string;
		email:string;
		password:string;
	}

	export interface SignInReply
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

	export interface CreateAccountReply
	{
		user_id:string;
		username:string;
		email:string;
		session_id:string;
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
		export var NULL = "null";
		export var BOOLEAN = "boolean";
		export var NUMBER = "number";
		export var STRING = "string";
		export var JSON = "json";
		export var XML = "xml";
		export var DATETIME = "datetime";
		export var BYTES = "bytes";
		export var OBJECT = "object";
	}

	export interface SetUserDataRequest
	{
		key:string;
		value:any;
		data_type:string;
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
		data_type:string;
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
		data_type:string;
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
		data_type:string;
	}



}