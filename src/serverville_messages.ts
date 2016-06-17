
// Generated, unfortunately. Edit original template in browser/templates/serverville_messages.ts.tmpl

namespace sv
{

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
		export const NULL:JsonDataTypeEnum = "null";
		export const BOOLEAN:JsonDataTypeEnum = "boolean";
		export const NUMBER:JsonDataTypeEnum = "number";
		export const STRING:JsonDataTypeEnum = "string";
		export const JSON:JsonDataTypeEnum = "json";
		export const XML:JsonDataTypeEnum = "xml";
		export const DATETIME:JsonDataTypeEnum = "datetime";
		export const BYTES:JsonDataTypeEnum = "bytes";
		export const OBJECT:JsonDataTypeEnum = "object";
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

	export interface KeyDataRecordRequest
	{
		id:string;
	}

	export interface KeyDataInfo
	{
		id:string;
		type:string;
		owner:string;
		parent:string;
		version:number;
		created:number;
		modified:number;
	}

	export interface SetGlobalDataRequest
	{
		id:string;
		values:Array<SetUserDataRequest>;
	}

	export interface SetTransientValueRequest
	{
		alias:string;
		key:string;
		value:any;
		data_type:JsonDataTypeEnum;
	}

	export interface EmptyClientReply
	{
	}

	export interface SetTransientValueItem
	{
		key:string;
		value:any;
		data_type:JsonDataTypeEnum;
	}

	export interface SetTransientValuesRequest
	{
		alias:string;
		values:Array<SetTransientValueItem>;
	}

	export interface GetTransientValueRequest
	{
		id:string;
		alias:string;
		key:string;
	}

	export interface GetTransientValuesRequest
	{
		id:string;
		alias:string;
		keys:Array<string>;
	}

	export interface GetAllTransientValuesRequest
	{
		id:string;
		alias:string;
	}

	export interface JoinChannelRequest
	{
		alias:string;
		id:string;
	}

	export interface ChannelMemberInfo
	{
		id:string;
		values:{[key:string]:any};
	}

	export interface ChannelInfo
	{
		id:string;
		values:{[key:string]:any};
		members:{[key:string]:ChannelMemberInfo};
	}

	export interface LeaveChannelRequest
	{
		alias:string;
		id:string;
	}

	export interface ListenToResidentRequest
	{
		id:string;
	}

	export interface StopListenToResidentRequest
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



}