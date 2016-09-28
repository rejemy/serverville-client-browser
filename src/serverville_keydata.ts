

namespace sv
{
	export class KeyData
	{
		id:string;
		server:Serverville;
		data:any;
		private data_info:{[key:string]:DataItemReply};
		private local_dirty:{[key:string]:DataItemReply};
		private most_recent:number;
		
		constructor(server:Serverville, id:string)
		{
			if(server == null)
				throw "Must supply a serverville server";
			if(id == null)
				throw "Data must have an id";
			this.id = id;
			this.server = server;
			this.data = {};
			this.data_info = {};
			this.local_dirty = {};
			
			this.most_recent = 0;
		}
		
		loadKeys(keys:string[], onDone?:()=>void):void
		{
			var self:KeyData = this;
			
			this.server.getDataKeys(this.id, keys, 0, false,
				function(reply:UserDataReply):void
				{
					for(var key in reply.values)
					{
						var dataInfo:DataItemReply = reply.values[key];
						self.data_info[dataInfo.key] = dataInfo;
						self.data[key] = dataInfo.value;
					}
					
					if(onDone)
						onDone();
				},
				function(reply:ErrorReply):void
				{
					if(onDone)
						onDone();
				}
			);
		}
		
		loadAll(onDone?:()=>void):void
		{
			this.data = {};
			this.local_dirty = {};
			
			var self:KeyData = this;
			this.server.getAllDataKeys(this.id, 0, false,
				function(reply:UserDataReply):void
				{
					self.data_info = reply.values;
					
					for(var key in self.data_info)
					{
						var dataInfo:DataItemReply = self.data_info[key];
						self.data[key] = dataInfo.value;
						if(dataInfo.modified > self.most_recent)
							self.most_recent = dataInfo.modified;
					}
					
					if(onDone)
						onDone();
				},
				function(reply:ErrorReply):void
				{
					if(onDone)
						onDone();
				}
			);
		}
		
		refresh(onDone?:()=>void):void
		{
			var self:KeyData = this;
			this.server.getAllDataKeys(this.id, this.most_recent, true,
				function(reply:UserDataReply):void
				{
					for(var key in reply.values)
					{
						var dataInfo:DataItemReply = reply.values[key];
						if(dataInfo.deleted)
						{
							delete self.data[key];
							delete self.data_info[key];
						}
						else
						{
							self.data[key] = dataInfo.value;
							self.data_info[key] = dataInfo;
						}
						
						if(dataInfo.modified > self.most_recent)
							self.most_recent = dataInfo.modified;
					}
					
					if(onDone)
						onDone();
				},
				function(reply:ErrorReply):void
				{
					if(onDone)
						onDone();
				}
			);

		}
		
		set(key:string, val:any, data_type:JsonDataTypeEnum = null):void
		{
			var user:UserAccountInfo = this.server.userInfo();
			if(user == null || user.user_id != this.id)
				throw "Read-only data!";
				
			this.data[key] = val;
			var info:DataItemReply = this.data_info[key];
			if(info)
			{
				info.value = val;
				if(data_type)
					info.data_type = data_type;
			}
			else
			{
				info = {
					"id":this.id,
					"key":key,
					"value":val,
					"data_type":data_type,
					"created":0,
					"modified":0,
                    "deleted":false
				};
				this.data_info[key] = info;
			}
			this.local_dirty[key] = info;
		}
		
		save(onDone?:()=>void):void
		{
			var user:UserAccountInfo = this.server.userInfo();
			if(user == null || user.user_id != this.id)
				throw "Read-only data!";
				
			var saveSet:SetUserDataRequest[] = [];
			
			for(var key in this.local_dirty)
			{
				var info:DataItemReply = this.local_dirty[key];
	
				saveSet.push(
					{
						"key":info.key,
						"value":info.value,
						"data_type":info.data_type
					}
				);
			}
			
			this.server.setUserKeys(saveSet,
				function(reply:SetDataReply):void
				{
					this.local_dirty = {};
					
					if(onDone)
						onDone();
				},
				function(reply:ErrorReply):void
				{
					if(onDone)
						onDone();
				}
			);

			
		}
	}
}