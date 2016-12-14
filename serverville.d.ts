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



	type ServerMessageTypeHandler = (message:UserMessageNotification)=>void;
	
    export class Serverville
	{
        ServerURL:string;
		ServerHost:string;
		SessionId:string;
        LogMessagesToConsole:boolean;
		PingPeriod:number;
		GlobalErrorHandler:(ev:ErrorReply)=>void;

        UserMessageTypeHandlers:{[id:string]:ServerMessageTypeHandler};
		UserMessageHandler:(message:UserMessageNotification)=>void;
		
		ResidentJoinedHandler:(notification:ResidentJoinedNotification)=>void;
		ResidentLeftHandler:(notification:ResidentLeftNotification)=>void;
		ResidentEventHandler:(notification:ResidentEventNotification)=>void;
		ResidentStateUpdateHandler:(notification:ResidentStateUpdateNotification)=>void;
		
        constructor(url:string);
        init(onComplete:(user:UserAccountInfo, err:ErrorReply)=>void):void;
		getServerTime():number;
        loadUserKeyData(onDone?:()=>void):KeyData;
		loadKeyData(id:string, onDone?:()=>void):KeyData;
		isSignedIn():boolean;
        signOut():void;
		shutdown():void;
		userInfo():UserAccountInfo;
		
		apiByName(api:string, request:Object, onSuccess:(reply:Object)=>void, onError?:(reply:ErrorReply)=>void):void;
		signInReq(request:SignIn, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		signIn(username:string, email:string, password:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		validateSessionReq(request:ValidateSessionRequest, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		validateSession(session_id:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		createAnonymousAccountReq(request:CreateAnonymousAccount, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		createAnonymousAccount(invite_code:string, language:string, country:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		createAccountReq(request:CreateAccount, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		createAccount(username:string, email:string, password:string, invite_code:string, language:string, country:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		convertToFullAccountReq(request:CreateAccount, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		convertToFullAccount(username:string, email:string, password:string, invite_code:string, language:string, country:string, onSuccess?:(reply:SignInReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTimeReq(request:EmptyClientRequest, onSuccess?:(reply:ServerTime)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTime(onSuccess?:(reply:ServerTime)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserInfoReq(request:GetUserInfo, onSuccess?:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserInfo(onSuccess?:(reply:UserAccountInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		setLocaleReq(request:SetLocaleRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setLocale(country:string, language:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserDataComboReq(request:GetUserDataComboRequest, onSuccess?:(reply:GetUserDataComboReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserDataCombo(since:number, onSuccess?:(reply:GetUserDataComboReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setUserKeyReq(request:SetUserDataRequest, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setUserKey(key:string, value:any, data_type:JsonDataTypeEnum, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setUserKeysReq(request:UserDataRequestList, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setUserKeys(values:Array<SetUserDataRequest>, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserKeyReq(request:KeyRequest, onSuccess?:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserKey(key:string, onSuccess?:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserKeysReq(request:KeysRequest, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getUserKeys(keys:Array<string>, since:number, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllUserKeysReq(request:AllKeysRequest, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllUserKeys(since:number, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getDataKeyReq(request:GlobalKeyRequest, onSuccess?:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getDataKey(id:string, key:string, onSuccess?:(reply:DataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getDataKeysReq(request:GlobalKeysRequest, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getDataKeys(id:string, keys:Array<string>, since:number, include_deleted:boolean, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllDataKeysReq(request:AllGlobalKeysRequest, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllDataKeys(id:string, since:number, include_deleted:boolean, onSuccess?:(reply:UserDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getKeyDataRecordReq(request:KeyDataRecordRequest, onSuccess?:(reply:KeyDataInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		getKeyDataRecord(id:string, onSuccess?:(reply:KeyDataInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		getKeyDataRecordsReq(request:KeyDataRecordsRequest, onSuccess?:(reply:KeyDataRecords)=>void, onError?:(reply:ErrorReply)=>void):void;
		getKeyDataRecords(record_type:string, parent:string, onSuccess?:(reply:KeyDataRecords)=>void, onError?:(reply:ErrorReply)=>void):void;
		setDataKeysReq(request:SetGlobalDataRequest, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setDataKeys(id:string, values:Array<SetUserDataRequest>, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		createResidentReq(request:CreateResidentRequest, onSuccess?:(reply:CreateResidentReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		createResident(resident_type:string, values:{[key:string]:any}, onSuccess?:(reply:CreateResidentReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		deleteResidentReq(request:DeleteResidentRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		deleteResident(resident_id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		removeResidentFromAllChannelsReq(request:RemoveResidentFromAllChannelsRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		removeResidentFromAllChannels(resident_id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValueReq(request:SetTransientValueRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValue(resident_id:string, key:string, value:any, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValuesReq(request:SetTransientValuesRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValues(resident_id:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		deleteTransientValueReq(request:DeleteTransientValueRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		deleteTransientValue(resident_id:string, key:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		deleteTransientValuesReq(request:DeleteTransientValuesRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		deleteTransientValues(resident_id:string, values:Array<string>, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValueReq(request:GetTransientValueRequest, onSuccess?:(reply:TransientDataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValue(resident_id:string, key:string, onSuccess?:(reply:TransientDataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValuesReq(request:GetTransientValuesRequest, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValues(resident_id:string, keys:Array<string>, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllTransientValuesReq(request:GetAllTransientValuesRequest, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllTransientValues(resident_id:string, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		joinChannelReq(request:JoinChannelRequest, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		joinChannel(channel_id:string, resident_id:string, values:{[key:string]:any}, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		leaveChannelReq(request:LeaveChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		leaveChannel(channel_id:string, resident_id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		addResidentToChannelReq(request:JoinChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		addResidentToChannel(channel_id:string, resident_id:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		removeResidentFromChannelReq(request:LeaveChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		removeResidentFromChannel(channel_id:string, resident_id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		listenToChannelReq(request:ListenToChannelRequest, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		listenToChannel(channel_id:string, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		stopListenToChannelReq(request:StopListenToChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		stopListenToChannel(channel_id:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		triggerResidentEventReq(request:TriggerResidentEventRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		triggerResidentEvent(resident_id:string, event_type:string, event_data:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		sendUserMessageReq(request:SendUserMessageRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		sendUserMessage(to:string, message_type:string, message:string, guaranteed:boolean, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getPendingMessagesReq(request:EmptyClientRequest, onSuccess?:(reply:UserMessageList)=>void, onError?:(reply:ErrorReply)=>void):void;
		getPendingMessages(onSuccess?:(reply:UserMessageList)=>void, onError?:(reply:ErrorReply)=>void):void;
		clearPendingMessageReq(request:ClearMessageRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		clearPendingMessage(id:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getCurrencyBalanceReq(request:CurrencyBalanceRequest, onSuccess?:(reply:CurrencyBalanceReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getCurrencyBalance(currency_id:string, onSuccess?:(reply:CurrencyBalanceReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getCurrencyBalancesReq(request:EmptyClientRequest, onSuccess?:(reply:CurrencyBalancesReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getCurrencyBalances(onSuccess?:(reply:CurrencyBalancesReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getProductsReq(request:GetProductsRequest, onSuccess?:(reply:ProductInfoList)=>void, onError?:(reply:ErrorReply)=>void):void;
		getProducts(onSuccess?:(reply:ProductInfoList)=>void, onError?:(reply:ErrorReply)=>void):void;
		getProductReq(request:GetProductRequest, onSuccess?:(reply:ProductInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		getProduct(product_id:string, onSuccess?:(reply:ProductInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		stripeCheckoutReq(request:StripeCheckoutRequest, onSuccess?:(reply:ProductPurchasedReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		stripeCheckout(stripe_token:string, product_id:string, onSuccess?:(reply:ProductPurchasedReply)=>void, onError?:(reply:ErrorReply)=>void):void;


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