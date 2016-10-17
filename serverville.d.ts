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
		type:string;
		owner:string;
		parent:string;
		version:number;
		created:number;
		modified:number;
	}

	export interface KeyDataRecordsRequest
	{
		type:string;
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

	export interface SetTransientValueRequest
	{
		alias:string;
		key:string;
		value:any;
	}

	export interface SetTransientValuesRequest
	{
		alias:string;
		values:{[key:string]:any};
	}

	export interface GetTransientValueRequest
	{
		id:string;
		alias:string;
		key:string;
	}

	export interface TransientDataItemReply
	{
		value:any;
	}

	export interface GetTransientValuesRequest
	{
		id:string;
		alias:string;
		keys:Array<string>;
	}

	export interface TransientDataItemsReply
	{
		values:{[key:string]:any};
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
		values:{[key:string]:any};
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
		final_values:{[key:string]:any};
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
		alias:string;
		message_type:string;
		value:any;
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



	type ServerMessageTypeHandler = (from:string, msg:Object)=>void;
	
    export class Serverville
	{
        ServerURL:string;
		ServerHost:string;
		SessionId:string;
        LogMessagesToConsole:boolean;
		PingPeriod:number;
		GlobalErrorHandler:(ev:ErrorReply)=>void;
        ServerMessageTypeHandlers:{[id:string]:ServerMessageTypeHandler};
		ServerMessageHandler:(messageType:string, from:string, msg:Object)=>void;
		
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
		getKeyDataRecords(type:string, parent:string, onSuccess?:(reply:KeyDataRecords)=>void, onError?:(reply:ErrorReply)=>void):void;
		setDataKeysReq(request:SetGlobalDataRequest, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setDataKeys(id:string, values:Array<SetUserDataRequest>, onSuccess?:(reply:SetDataReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValueReq(request:SetTransientValueRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValue(alias:string, key:string, value:any, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValuesReq(request:SetTransientValuesRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		setTransientValues(alias:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValueReq(request:GetTransientValueRequest, onSuccess?:(reply:TransientDataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValue(id:string, alias:string, key:string, onSuccess?:(reply:TransientDataItemReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValuesReq(request:GetTransientValuesRequest, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getTransientValues(id:string, alias:string, keys:Array<string>, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllTransientValuesReq(request:GetAllTransientValuesRequest, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		getAllTransientValues(id:string, alias:string, onSuccess?:(reply:TransientDataItemsReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		joinChannelReq(request:JoinChannelRequest, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		joinChannel(alias:string, id:string, values:{[key:string]:any}, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		leaveChannelReq(request:LeaveChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		leaveChannel(alias:string, id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		addAliasToChannelReq(request:JoinChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		addAliasToChannel(alias:string, id:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		removeAliasFromChannelReq(request:LeaveChannelRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		removeAliasFromChannel(alias:string, id:string, final_values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		listenToChannelReq(request:ListenToResidentRequest, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		listenToChannel(id:string, onSuccess?:(reply:ChannelInfo)=>void, onError?:(reply:ErrorReply)=>void):void;
		stopListenToChannelReq(request:StopListenToResidentRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		stopListenToChannel(id:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		sendClientMessageReq(request:TransientMessageRequest, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		sendClientMessage(to:string, alias:string, message_type:string, value:any, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
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