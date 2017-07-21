/// <reference path="serverville_keydata.ts" />

namespace sv
{
	export interface ResidentFactory
	{
		makeChannel(channelType:string):Channel;
		makeResident(residentType:string):Resident;
	}

	abstract class BaseResidentSystem
	{
		protected Factory:ResidentFactory;
		protected Residents:{[id:string]:BaseResident} = {};

		constructor(factory:ResidentFactory)
		{
			this.Factory = factory;
		}

		protected getResident(id:string, residentType:string, values:{[key:string]:any}):Resident
		{
			let member:Resident = <Resident>this.Residents[id];
			if(member)
			{
				if(values != null)
				{
					for(let key in values)
					{
						member.Values[key] = values[key];
					}
				}
			}
			else
			{
				this.makeResident(id, residentType);
				this.Residents[id] = member;
				if(values != null)
					member.Values = values;
			}
			return member;
		}

		protected makeChannel(id:string, channelType:string):Channel
		{
			let channel:Channel = null;
			if(this.Factory)
				channel = this.Factory.makeChannel(channelType);
			if(channel == null)
				channel = new Channel();
			channel.init(this, id, channelType);
			return channel;
		}

		protected makeResident(id:string, residentType:string):Resident
		{
			let resident:Resident = null;
			if(this.Factory)
				resident = this.Factory.makeResident(residentType);
			if(resident == null)
				resident = new Resident();
			resident.init(this, id, residentType);
			return resident;
		}

		protected checkIfMemberIsLive(member:Resident):void
		{
			let stillInChannel:boolean = false;
			for(let key in member.Channels)
			{
				stillInChannel = true;
				break;
			}

			if(!stillInChannel)
			{
				delete this.Residents[member.Id];
			}
		}
		

		abstract setTransientValues(resident_id:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
		abstract triggerResidentEvent(resident_id:string, event_type:string, event_data:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void;
	}

	export class ResidentSystem extends BaseResidentSystem
	{
		private Server:Serverville;

		constructor(server:Serverville, factory:ResidentFactory)
		{
			super(factory);

			this.Server = server;
			
			this.Server.ResidentJoinedHandler = this.residentJoinedHandler;
			this.Server.ResidentLeftHandler = this.residentLeftHandler;
			this.Server.ResidentEventHandler = this.onResidentEventNotification;
			this.Server.ResidentStateUpdateHandler = this.residentStateUpdateHandler;
		}

		listenToChannel(id:string, onLoaded:(channel:Channel)=>void):void
		{
			let res:BaseResident = this.Residents[id];
			if(!(res instanceof Channel))
			{
				if(onLoaded != null)
					onLoaded(null);
				return;
			}
			let channel:Channel = res;
			onLoaded(channel);
			
			let self:ResidentSystem = this;
			this.Server.listenToChannel(id, function(reply:ChannelInfo):void
			{
				channel = self.makeChannel(reply.channel_id, reply.channel_type);
				
				channel.Values = reply.values;
				
				for(let key in reply.members)
				{
					let memberInfo:ChannelMemberInfo = reply.members[key];
					let member:Resident = self.getResident(memberInfo.resident_id, memberInfo.resident_type, memberInfo.values);
					channel.Residents[member.Id] = member;
					member.Channels[channel.Id] = channel;

					channel.onResidentJoined(member);
				}

				self.Residents[id] = channel;

				channel.onLoaded();

				if(onLoaded != null)
					onLoaded(channel);

			}, function(err:ErrorReply):void
			{
				onLoaded(null);
			});

		}

		stopListeningToChannel(channel:Channel):void
		{
			this.Server.stopListenToChannel(channel.Id);

			for(let id in channel.Residents)
			{
				let member:Resident = channel.Residents[id];
				delete member.Channels[channel.Id];
				this.checkIfMemberIsLive(member);
			}

			delete this.Residents[channel.Id];
		}

		private residentJoinedHandler(notification:ResidentJoinedNotification):void
		{
			let channel:Channel = <Channel>this.Residents[notification.via_channel];
			if(!channel)
				return;
			
			let member:Resident = this.getResident(notification.resident_id, notification.resident_type, notification.values);
			channel.Residents[member.Id] = member;
			member.Channels[channel.Id] = channel;

			member.onJoinedChannel(channel);
			channel.onResidentJoined(member);
		}
		
		private residentLeftHandler(notification:ResidentLeftNotification):void
		{
			let channel:Channel = <Channel>this.Residents[notification.via_channel];
			if(!channel)
				return;
			
			let member:Resident = <Resident>this.Residents[notification.resident_id];
			if(!member)
				return;
			
			delete channel.Residents[member.Id];
			delete member.Channels[channel.Id];

			member.onLeftChannel(channel);
			channel.onResidentLeft(member);

			this.checkIfMemberIsLive(member);
		}

		private onResidentEventNotification(notification:ResidentEventNotification):void
		{
			let resident:BaseResident = this.Residents[notification.resident_id];
			if(!resident)
				return;
			
			let eventData:object = JSON.parse(notification.event_data);

			resident.onResidentEvent(notification.event_type, eventData);
		}

		private residentStateUpdateHandler(notification:ResidentStateUpdateNotification):void
		{
			let resident:BaseResident = this.Residents[notification.resident_id];
			if(!resident)
				return;
			
			resident.onStateUpdate(notification.values);
		}

		setTransientValues(resident_id:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.Server.setTransientValues(resident_id, values, onSuccess, onError);
		}

		triggerResidentEvent(resident_id:string, event_type:string, event_data:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			this.Server.triggerResidentEvent(resident_id, event_type, event_data, onSuccess, onError);
		}

	}

	function callInNextFrame(f:()=>void):void
	{
		window.requestAnimationFrame(f);
	}

	export class LocalResidentSystem extends BaseResidentSystem
	{
		NextId:number = 1;

		constructor(factory:ResidentFactory)
		{
			super(factory);
		}

		makeLocalId():string
		{
			let id:string = this.NextId.toString(16);
			this.NextId++;
			return "l"+id;
		}

		createChannel(channelType:string, id:string):Channel
		{
			if(!id)
				id = this.makeLocalId();

			let channel:Channel = this.makeChannel(id, channelType);
			this.Residents[id] = channel;

			return channel;
		}

		removeChannel(channel:Channel):void
		{
			for(let id in channel.Residents)
			{
				let member:Resident = channel.Residents[id];
				delete member.Channels[channel.Id];
				this.checkIfMemberIsLive(member);
			}
			
			delete this.Residents[channel.Id];
		}

		createResident(residentType:string, id:string):Resident
		{
			if(!id)
				id = this.makeLocalId();

			let resident:Resident = this.makeResident(id, residentType);
			this.Residents[id] = resident;

			return resident;
		}

		addResidentToChannel(channel:Channel, member:Resident):void
		{
			channel.Residents[member.Id] = member;
			member.Channels[channel.Id] = channel;
			this.Residents[member.Id] = member;

			member.onJoinedChannel(channel);
			channel.onResidentJoined(member);
		}

		removeResidentFromChannel(channel:Channel, member:Resident):void
		{
			delete channel.Residents[member.Id];
			delete member.Channels[channel.Id];

			member.onLeftChannel(channel);
			channel.onResidentLeft(member);

			this.checkIfMemberIsLive(member);
		}

		setTransientValues(resident_id:string, values:{[key:string]:any}, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			let resident:BaseResident = this.Residents[resident_id];
			if(!resident)
				return;
			
			callInNextFrame(function():void
			{
				resident.onStateUpdate(values);
				onSuccess({});
			});
		}

		triggerResidentEvent(resident_id:string, event_type:string, event_data:string, onSuccess?:(reply:EmptyClientReply)=>void, onError?:(reply:ErrorReply)=>void):void
		{
			let resident:BaseResident = this.Residents[resident_id];
			if(!resident)
				return;
			
			callInNextFrame(function():void
			{
				let eventData:object = JSON.parse(event_data);
				resident.onResidentEvent(event_type, eventData);
				onSuccess({});
			});
		}
	}

	export class BaseResident
	{
		Id:string;
		TypeId:string;
		Values:{[key:string]:any};

		private PendingChanges:{[key:string]:any};
		private Dirty:boolean;
		private System:BaseResidentSystem;

		init(system:BaseResidentSystem, id:string, typeId:string)
		{
			this.System = system;
			this.Id = id;
			this.TypeId = typeId;
			this.Dirty = false;
		}

		setValue(prop:string, value:any):void
		{
			this.PendingChanges[prop] = value;
			this.Dirty = true;
		}

		update():void
		{
			if(!this.Dirty)
				return;
			
			this.System.setTransientValues(this.Id, this.PendingChanges);

			this.PendingChanges = {};
			this.Dirty = false;
		}

		onResidentEvent(eventType:string, eventData:object):void
		{
			let handlerName:string = "on"+eventType+"Event";
			let handler:(eventData:object)=>void = (<any>this)[handlerName];
			if(handler)
				handler(eventData);
		}

		onStateUpdate(values:{[key:string]:any}):void
		{
			for(let key in values)
			{
				let oldVal:any = this.Values[key];
				let newVal:any = values[key];
				this.Values[key] = newVal;

				let handlerName:string = "on"+key+"Update";
				let handler:(oldVal:any, newVal:any)=>void = (<any>this)[handlerName];
				if(handler)
					handler(oldVal, newVal);
			}
		}

		triggerEvent(eventType:string, eventData:object):void
		{
			let eventString:string = JSON.stringify(eventData);
			this.System.triggerResidentEvent(this.Id, eventType, eventString);
		}
	}

	export class Channel extends BaseResident
	{
		Residents:{[key:string]:Resident} = {};

		onLoaded():void
		{

		}

		onResidentJoined(resident:Resident):void
		{

		}

		onResidentLeft(resident:Resident):void
		{

		}
	}

	export class Resident extends BaseResident
	{
		Channels:{[key:string]:Channel} = {};

		onJoinedChannel(channel:Channel):void
		{

		}

		onLeftChannel(channel:Channel):void
		{
			
		}
	}

}