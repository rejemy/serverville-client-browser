
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
		admin_level:number;
		language:string;
		country:string;
		time:number;
	}

	export interface ValidateSessionRequest
	{
		session_id:string;
	}

	export interface CreateAnonymousAccount
	{
		invite_code:string;
		language:string;
		country:string;
	}

	export interface CreateAccount
	{
		username:string;
		email:string;
		password:string;
		invite_code:string;
		language:string;
		country:string;
	}

	export interface EmptyClientRequest
	{
	}

	export interface ServerTime
	{
		time:number;
	}

	export interface GetUserInfo
	{
	}

	export interface UserAccountInfo
	{
		user_id:string;
		username:string;
		email:string;
		session_id:string;
		admin_level:number;
	}

	export interface SetLocaleRequest
	{
		country:string;
		language:string;
	}

	export interface EmptyClientReply
	{
	}

	export interface GetUserDataComboRequest
	{
		since:number;
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

	export interface GetUserDataComboReply
	{
		values:{[key:string]:DataItemReply};
		balances:{[key:string]:number};
	}

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

	export interface PageGlobalKeysRequest
	{
		id:string;
		page_size:number;
		start_after:string;
		descending:boolean;
	}

	export interface OrderedDataReply
	{
		values:Array<DataItemReply>;
	}

	export interface KeyDataRecordRequest
	{
		id:string;
	}

	export interface KeyDataInfo
	{
		id:string;
		record_type:string;
		owner:string;
		parent:string;
		version:number;
		created:number;
		modified:number;
	}

	export interface KeyDataRecordsRequest
	{
		record_type:string;
		parent:string;
	}

	export interface KeyDataRecords
	{
		records:Array<KeyDataInfo>;
	}

	export interface SetGlobalDataRequest
	{
		id:string;
		values:Array<SetUserDataRequest>;
	}

	export interface GetHostWithResidentRequest
	{
		resident_id:string;
	}

	export interface GetHostWithResidentReply
	{
		host:string;
	}

	export interface CreateResidentRequest
	{
		resident_type:string;
		values:{[key:string]:any};
	}

	export interface CreateResidentReply
	{
		resident_id:string;
	}

	export interface DeleteResidentRequest
	{
		resident_id:string;
		final_values:{[key:string]:any};
	}

	export interface RemoveResidentFromAllChannelsRequest
	{
		resident_id:string;
		final_values:{[key:string]:any};
	}

	export interface SetTransientValueRequest
	{
		resident_id:string;
		key:string;
		value:any;
	}

	export interface SetTransientValuesRequest
	{
		resident_id:string;
		values:{[key:string]:any};
	}

	export interface DeleteTransientValueRequest
	{
		resident_id:string;
		key:string;
	}

	export interface DeleteTransientValuesRequest
	{
		resident_id:string;
		values:Array<string>;
	}

	export interface GetTransientValueRequest
	{
		resident_id:string;
		key:string;
	}

	export interface TransientDataItemReply
	{
		value:any;
	}

	export interface GetTransientValuesRequest
	{
		resident_id:string;
		keys:Array<string>;
	}

	export interface TransientDataItemsReply
	{
		values:{[key:string]:any};
	}

	export interface GetAllTransientValuesRequest
	{
		resident_id:string;
	}

	export interface JoinChannelRequest
	{
		channel_id:string;
		resident_id:string;
		values:{[key:string]:any};
	}

	export interface ChannelMemberInfo
	{
		resident_id:string;
		values:{[key:string]:any};
	}

	export interface ChannelInfo
	{
		channel_id:string;
		values:{[key:string]:any};
		members:{[key:string]:ChannelMemberInfo};
	}

	export interface LeaveChannelRequest
	{
		channel_id:string;
		resident_id:string;
		final_values:{[key:string]:any};
	}

	export interface ListenToChannelRequest
	{
		channel_id:string;
	}

	export interface StopListenToChannelRequest
	{
		channel_id:string;
	}

	export interface TriggerResidentEventRequest
	{
		resident_id:string;
		event_type:string;
		event_data:string;
	}

	export interface SendUserMessageRequest
	{
		to:string;
		message_type:string;
		message:string;
		guaranteed:boolean;
	}

	export interface UserMessageNotification
	{
		id:string;
		message_type:string;
		message:string;
		from_id:string;
		sender_is_user:boolean;
	}

	export interface UserMessageList
	{
		messages:Array<UserMessageNotification>;
	}

	export interface ClearMessageRequest
	{
		id:string;
	}

	export interface CurrencyBalanceRequest
	{
		currency_id:string;
	}

	export interface CurrencyBalanceReply
	{
		currency_id:string;
		balance:number;
	}

	export interface CurrencyBalancesReply
	{
		balances:{[key:string]:number};
	}

	export interface GetProductsRequest
	{
	}

	export interface ProductInfo
	{
		id:string;
		name:string;
		description:string;
		image_url:string;
		price:number;
		display_price:string;
		currency:string;
	}

	export interface ProductInfoList
	{
		products:Array<ProductInfo>;
	}

	export interface GetProductRequest
	{
		product_id:string;
	}

	export interface StripeCheckoutRequest
	{
		stripe_token:string;
		product_id:string;
	}

	export interface ProductPurchasedReply
	{
		product_id:string;
		price:number;
		currencies:{[key:string]:number};
	}

	export interface ResidentJoinedNotification
	{
		resident_id:string;
		via_channel:string;
		values:{[key:string]:any};
	}

	export interface ResidentStateUpdateNotification
	{
		resident_id:string;
		via_channel:string;
		values:{[key:string]:any};
		deleted:Array<string>;
	}

	export interface ResidentLeftNotification
	{
		resident_id:string;
		via_channel:string;
		final_values:{[key:string]:any};
	}

	export interface ResidentEventNotification
	{
		resident_id:string;
		via_channel:string;
		event_type:string;
		event_data:string;
	}

	export interface PendingNotification
	{
		notification_type:string;
		body:string;
	}

	export interface PendingNotificationList
	{
		notifications:Array<PendingNotification>;
	}



}