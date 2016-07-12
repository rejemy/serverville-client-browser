// Generated, unfortunately. Edit original template in browser/templates/serverville_messages.ts.tmpl
var sv;
(function (sv) {
    var JsonDataType;
    (function (JsonDataType) {
        JsonDataType.NULL = "null";
        JsonDataType.BOOLEAN = "boolean";
        JsonDataType.NUMBER = "number";
        JsonDataType.STRING = "string";
        JsonDataType.JSON = "json";
        JsonDataType.XML = "xml";
        JsonDataType.DATETIME = "datetime";
        JsonDataType.BYTES = "bytes";
        JsonDataType.OBJECT = "object";
    })(JsonDataType = sv.JsonDataType || (sv.JsonDataType = {}));
})(sv || (sv = {}));
var sv;
(function (sv) {
    function makeClientError(code, details) {
        if (details === void 0) { details = null; }
        var msg = "Unknown network error";
        switch (code) {
            case -1:
                msg = "Connection closed";
                break;
            case -2:
                msg = "Network error";
                break;
        }
        return { errorCode: code, errorMessage: msg, errorDetails: details };
    }
    sv.makeClientError = makeClientError;
})(sv || (sv = {}));
/// <reference path="serverville_types.ts" />
var sv;
(function (sv_1) {
    var HttpTransport = (function () {
        function HttpTransport(sv) {
            this.SV = sv;
        }
        HttpTransport.prototype.init = function (onConnected) {
            if (onConnected != null)
                onConnected(null);
        };
        HttpTransport.prototype.callApi = function (api, request, onSuccess, onError) {
            var req = new XMLHttpRequest();
            req.open("POST", this.SV.ServerURL + "/api/" + api);
            if (this.SV.SessionId)
                req.setRequestHeader("Authorization", this.SV.SessionId);
            req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            var body = JSON.stringify(request);
            if (this.SV.LogMessagesToConsole)
                console.log("HTTP<- " + body);
            var self = this.SV;
            req.onload = function (ev) {
                if (self.LogMessagesToConsole)
                    console.log("HTTP-> " + req.response);
                if (req.status >= 200 && req.status < 400) {
                    var message = JSON.parse(req.response);
                    if (onSuccess) {
                        onSuccess(message);
                    }
                }
                else {
                    var error = JSON.parse(req.response);
                    if (onError)
                        onError(error);
                    else
                        self._onServerError(error);
                }
            };
            req.onerror = function (ev) {
                var err = sv_1.makeClientError(-2);
                self._onServerError(err);
                if (onError)
                    onError(err);
            };
            req.send(body);
        };
        HttpTransport.prototype.close = function () {
        };
        return HttpTransport;
    }());
    sv_1.HttpTransport = HttpTransport;
})(sv || (sv = {}));
/// <reference path="serverville_types.ts" />
var sv;
(function (sv_2) {
    var WebSocketTransport = (function () {
        function WebSocketTransport(sv) {
            this.MessageSequence = 0;
            this.ReplyCallbacks = {};
            this.SV = sv;
        }
        WebSocketTransport.prototype.init = function (onConnected) {
            var url = this.SV.ServerURL + "/websocket";
            this.ServerSocket = new WebSocket(url);
            this.Connected = false;
            var self = this;
            this.ServerSocket.onopen = function (evt) {
                this.Connected = true;
                onConnected(null);
            };
            this.ServerSocket.onclose = function (evt) {
                self.onWSClosed(evt);
                this.Connected = false;
            };
            this.ServerSocket.onmessage = function (evt) {
                self.onWSMessage(evt);
            };
            this.ServerSocket.onerror = function (evt) {
                if (onConnected != null) {
                    onConnected(sv_2.makeClientError(-2, evt.message));
                }
            };
        };
        WebSocketTransport.prototype.callApi = function (api, request, onSuccess, onError) {
            var messageNum = (this.MessageSequence++).toString();
            var message = api + ":" + messageNum + ":" + JSON.stringify(request);
            if (this.SV.LogMessagesToConsole)
                console.log("WS<- " + message);
            var self = this.SV;
            var callback = function (isError, reply) {
                if (isError) {
                    if (onError)
                        onError(reply);
                    else
                        self._onServerError(reply);
                }
                else {
                    if (onSuccess)
                        onSuccess(reply);
                }
            };
            this.ReplyCallbacks[messageNum] = callback;
            this.ServerSocket.send(message);
        };
        WebSocketTransport.prototype.close = function () {
            if (this.ServerSocket)
                this.ServerSocket.close();
        };
        WebSocketTransport.prototype.onWSClosed = function (evt) {
            if (this.Connected == false) {
                // Ignore close when we never actually got open first
                return;
            }
            console.log("Web socket closed");
            this.SV._onTransportClosed();
        };
        WebSocketTransport.prototype.onWSMessage = function (evt) {
            var messageStr = evt.data;
            if (this.SV.LogMessagesToConsole)
                console.log("WS-> " + messageStr);
            var split1 = messageStr.indexOf(":");
            if (split1 < 1) {
                console.log("Incorrectly formatted message");
                return;
            }
            var messageType = messageStr.substring(0, split1);
            if (messageType == "M") {
                // Server push message
                var split2 = messageStr.indexOf(":", split1 + 1);
                if (split2 < 0) {
                    console.log("Incorrectly formatted message");
                    return;
                }
                var split3 = messageStr.indexOf(":", split2 + 1);
                if (split3 < 0) {
                    console.log("Incorrectly formatted message");
                    return;
                }
                var split4 = messageStr.indexOf(":", split3 + 1);
                if (split4 < 0) {
                    console.log("Incorrectly formatted message");
                    return;
                }
                var messageType = messageStr.substring(split1 + 1, split2);
                var messageFrom = messageStr.substring(split2 + 1, split3);
                var messageVia = messageStr.substring(split3 + 1, split4);
                var messageJson = messageStr.substring(split4 + 1);
                var messageData = messageJson.length ? JSON.parse(messageJson) : null;
                this.SV._onServerMessage(messageType, messageFrom, messageVia, messageData);
            }
            else if (messageType == "E" || messageType == "R") {
                // Reply
                var split2 = messageStr.indexOf(":", split1 + 1);
                if (split2 < 0) {
                    console.log("Incorrectly formatted message");
                    return;
                }
                var messageNum = messageStr.substring(split1 + 1, split2);
                var messageJson = messageStr.substring(split2 + 1);
                var messageData = JSON.parse(messageJson);
                var isError = false;
                if (messageType == "E")
                    isError = true;
                var callback = this.ReplyCallbacks[messageNum];
                delete this.ReplyCallbacks[messageNum];
                callback(isError, messageData);
            }
            else {
                console.log("Unknown server message: " + messageStr);
            }
        };
        return WebSocketTransport;
    }());
    sv_2.WebSocketTransport = WebSocketTransport;
})(sv || (sv = {}));
/// <reference path="serverville_messages.ts" />
/// <reference path="serverville_http.ts" />
/// <reference path="serverville_ws.ts" />
// Generated, unfortunately. Edit original template in browser/templates/serverville.ts.tmpl
var sv;
(function (sv) {
    var Serverville = (function () {
        function Serverville(url) {
            this.LogMessagesToConsole = false;
            this.PingPeriod = 5000;
            this.ServerMessageTypeHandlers = {};
            this.LastSend = 0;
            this.PingTimer = 0;
            this.LastServerTime = 0;
            this.LastServerTimeAt = 0;
            this.ServerURL = url;
            this.SessionId = localStorage.getItem("SessionId");
            if (this.ServerURL.substr(0, 5) == "ws://" || this.ServerURL.substr(0, 6) == "wss://") {
                this.Transport = new sv.WebSocketTransport(this);
            }
            else if (this.ServerURL.substr(0, 7) == "http://" || this.ServerURL.substr(0, 8) == "https://") {
                this.Transport = new sv.HttpTransport(this);
            }
            else {
                throw "Unknown server protocol: " + url;
            }
        }
        Serverville.prototype.init = function (onComplete) {
            var self = this;
            this.Transport.init(function (err) {
                if (err != null) {
                    onComplete(null, err);
                    return;
                }
                if (self.SessionId) {
                    self.validateSession(self.SessionId, function (reply) {
                        onComplete(reply, null);
                        self.startPingHeartbeat();
                    }, function (err) {
                        self.signOut();
                        onComplete(null, err);
                    });
                }
                else {
                    onComplete(null, null);
                }
            });
        };
        Serverville.prototype.startPingHeartbeat = function () {
            if (this.PingTimer != 0)
                return;
            var self = this;
            this.PingTimer = window.setInterval(function () {
                self.ping();
            }, this.PingPeriod);
        };
        Serverville.prototype.stopPingHeartbeat = function () {
            if (this.PingTimer != 0) {
                window.clearInterval(this.PingTimer);
            }
            this.PingTimer = 0;
        };
        Serverville.prototype.setUserInfo = function (userInfo) {
            if (userInfo == null) {
                this.UserInfo = null;
                this.SessionId = null;
                localStorage.removeItem("SessionId");
            }
            else {
                this.UserInfo = userInfo;
                this.SessionId = userInfo.session_id;
                localStorage.setItem("SessionId", this.SessionId);
                this.setServerTime(userInfo.time);
            }
        };
        Serverville.prototype.userInfo = function () {
            return this.UserInfo;
        };
        Serverville.prototype._onServerError = function (err) {
            if (this.GlobalErrorHandler != null)
                this.GlobalErrorHandler(err);
            if (err.errorCode == 19) {
                this.shutdown();
            }
        };
        Serverville.prototype._onServerMessage = function (messageId, from, via, data) {
            if (messageId == "_error") {
                // Pushed error
                this._onServerError(data);
                return;
            }
            var typeHandler = this.ServerMessageTypeHandlers[messageId];
            if (typeHandler != null) {
                typeHandler(from, via, data);
            }
            else if (this.ServerMessageHandler != null) {
                this.ServerMessageHandler(messageId, from, via, data);
            }
            else {
                console.log("No handler for message " + messageId);
            }
        };
        Serverville.prototype._onTransportClosed = function () {
            this.stopPingHeartbeat();
            this._onServerError(sv.makeClientError(-1));
        };
        Serverville.prototype.ping = function () {
            if (performance.now() - this.LastSend < 4000)
                return;
            var self = this;
            this.getTime(function (reply) {
                self.setServerTime(reply.time);
            });
        };
        Serverville.prototype.setServerTime = function (time) {
            this.LastServerTime = time;
            this.LastServerTimeAt = performance.now();
        };
        Serverville.prototype.getServerTime = function () {
            if (this.LastServerTime == 0)
                return 0;
            return (performance.now() - this.LastServerTimeAt) + this.LastServerTime;
        };
        Serverville.prototype.getLastSendTime = function () {
            return this.LastSend;
        };
        Serverville.prototype.loadUserKeyData = function (onDone) {
            if (!this.UserInfo)
                throw "No user loaded";
            var data = new sv.KeyData(this, this.UserInfo.user_id);
            data.loadAll(onDone);
            return data;
        };
        Serverville.prototype.loadKeyData = function (id, onDone) {
            var data = new sv.KeyData(this, id);
            data.loadAll(onDone);
            return data;
        };
        Serverville.prototype.isSignedIn = function () {
            return this.SessionId != null;
        };
        Serverville.prototype.signOut = function () {
            this.setUserInfo(null);
        };
        Serverville.prototype.shutdown = function () {
            if (this.Transport) {
                this.Transport.close();
            }
        };
        Serverville.prototype.apiByName = function (api, request, onSuccess, onError) {
            this.Transport.callApi(api, request, onSuccess, onError);
            this.LastSend = performance.now();
        };
        Serverville.prototype.signInReq = function (request, onSuccess, onError) {
            var self = this;
            this.apiByName("SignIn", request, function (reply) { self.setUserInfo(reply); if (onSuccess) {
                onSuccess(reply);
            } }, onError);
        };
        Serverville.prototype.signIn = function (username, email, password, onSuccess, onError) {
            this.signInReq({
                "username": username,
                "email": email,
                "password": password
            }, onSuccess, onError);
        };
        Serverville.prototype.validateSessionReq = function (request, onSuccess, onError) {
            var self = this;
            this.apiByName("ValidateSession", request, function (reply) { self.setUserInfo(reply); if (onSuccess) {
                onSuccess(reply);
            } }, onError);
        };
        Serverville.prototype.validateSession = function (session_id, onSuccess, onError) {
            this.validateSessionReq({
                "session_id": session_id
            }, onSuccess, onError);
        };
        Serverville.prototype.createAnonymousAccountReq = function (request, onSuccess, onError) {
            var self = this;
            this.apiByName("CreateAnonymousAccount", request, function (reply) { self.setUserInfo(reply); if (onSuccess) {
                onSuccess(reply);
            } }, onError);
        };
        Serverville.prototype.createAnonymousAccount = function (invite_code, onSuccess, onError) {
            this.createAnonymousAccountReq({
                "invite_code": invite_code
            }, onSuccess, onError);
        };
        Serverville.prototype.createAccountReq = function (request, onSuccess, onError) {
            var self = this;
            this.apiByName("CreateAccount", request, function (reply) { self.setUserInfo(reply); if (onSuccess) {
                onSuccess(reply);
            } }, onError);
        };
        Serverville.prototype.createAccount = function (username, email, password, invite_code, onSuccess, onError) {
            this.createAccountReq({
                "username": username,
                "email": email,
                "password": password,
                "invite_code": invite_code
            }, onSuccess, onError);
        };
        Serverville.prototype.convertToFullAccountReq = function (request, onSuccess, onError) {
            var self = this;
            this.apiByName("ConvertToFullAccount", request, function (reply) { self.setUserInfo(reply); if (onSuccess) {
                onSuccess(reply);
            } }, onError);
        };
        Serverville.prototype.convertToFullAccount = function (username, email, password, invite_code, onSuccess, onError) {
            this.convertToFullAccountReq({
                "username": username,
                "email": email,
                "password": password,
                "invite_code": invite_code
            }, onSuccess, onError);
        };
        Serverville.prototype.getTimeReq = function (request, onSuccess, onError) {
            this.apiByName("GetTime", request, onSuccess, onError);
        };
        Serverville.prototype.getTime = function (onSuccess, onError) {
            this.getTimeReq({}, onSuccess, onError);
        };
        Serverville.prototype.getUserInfoReq = function (request, onSuccess, onError) {
            this.apiByName("GetUserInfo", request, onSuccess, onError);
        };
        Serverville.prototype.getUserInfo = function (onSuccess, onError) {
            this.getUserInfoReq({}, onSuccess, onError);
        };
        Serverville.prototype.setUserKeyReq = function (request, onSuccess, onError) {
            this.apiByName("SetUserKey", request, onSuccess, onError);
        };
        Serverville.prototype.setUserKey = function (key, value, data_type, onSuccess, onError) {
            this.setUserKeyReq({
                "key": key,
                "value": value,
                "data_type": data_type
            }, onSuccess, onError);
        };
        Serverville.prototype.setUserKeysReq = function (request, onSuccess, onError) {
            this.apiByName("SetUserKeys", request, onSuccess, onError);
        };
        Serverville.prototype.setUserKeys = function (values, onSuccess, onError) {
            this.setUserKeysReq({
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.getUserKeyReq = function (request, onSuccess, onError) {
            this.apiByName("GetUserKey", request, onSuccess, onError);
        };
        Serverville.prototype.getUserKey = function (key, onSuccess, onError) {
            this.getUserKeyReq({
                "key": key
            }, onSuccess, onError);
        };
        Serverville.prototype.getUserKeysReq = function (request, onSuccess, onError) {
            this.apiByName("GetUserKeys", request, onSuccess, onError);
        };
        Serverville.prototype.getUserKeys = function (keys, since, onSuccess, onError) {
            this.getUserKeysReq({
                "keys": keys,
                "since": since
            }, onSuccess, onError);
        };
        Serverville.prototype.getAllUserKeysReq = function (request, onSuccess, onError) {
            this.apiByName("GetAllUserKeys", request, onSuccess, onError);
        };
        Serverville.prototype.getAllUserKeys = function (since, onSuccess, onError) {
            this.getAllUserKeysReq({
                "since": since
            }, onSuccess, onError);
        };
        Serverville.prototype.getDataKeyReq = function (request, onSuccess, onError) {
            this.apiByName("GetDataKey", request, onSuccess, onError);
        };
        Serverville.prototype.getDataKey = function (id, key, onSuccess, onError) {
            this.getDataKeyReq({
                "id": id,
                "key": key
            }, onSuccess, onError);
        };
        Serverville.prototype.getDataKeysReq = function (request, onSuccess, onError) {
            this.apiByName("GetDataKeys", request, onSuccess, onError);
        };
        Serverville.prototype.getDataKeys = function (id, keys, since, include_deleted, onSuccess, onError) {
            this.getDataKeysReq({
                "id": id,
                "keys": keys,
                "since": since,
                "include_deleted": include_deleted
            }, onSuccess, onError);
        };
        Serverville.prototype.getAllDataKeysReq = function (request, onSuccess, onError) {
            this.apiByName("GetAllDataKeys", request, onSuccess, onError);
        };
        Serverville.prototype.getAllDataKeys = function (id, since, include_deleted, onSuccess, onError) {
            this.getAllDataKeysReq({
                "id": id,
                "since": since,
                "include_deleted": include_deleted
            }, onSuccess, onError);
        };
        Serverville.prototype.getKeyDataRecordReq = function (request, onSuccess, onError) {
            this.apiByName("GetKeyDataRecord", request, onSuccess, onError);
        };
        Serverville.prototype.getKeyDataRecord = function (id, onSuccess, onError) {
            this.getKeyDataRecordReq({
                "id": id
            }, onSuccess, onError);
        };
        Serverville.prototype.setDataKeysReq = function (request, onSuccess, onError) {
            this.apiByName("SetDataKeys", request, onSuccess, onError);
        };
        Serverville.prototype.setDataKeys = function (id, values, onSuccess, onError) {
            this.setDataKeysReq({
                "id": id,
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.setTransientValueReq = function (request, onSuccess, onError) {
            this.apiByName("SetTransientValue", request, onSuccess, onError);
        };
        Serverville.prototype.setTransientValue = function (alias, key, value, onSuccess, onError) {
            this.setTransientValueReq({
                "alias": alias,
                "key": key,
                "value": value
            }, onSuccess, onError);
        };
        Serverville.prototype.setTransientValuesReq = function (request, onSuccess, onError) {
            this.apiByName("SetTransientValues", request, onSuccess, onError);
        };
        Serverville.prototype.setTransientValues = function (alias, values, onSuccess, onError) {
            this.setTransientValuesReq({
                "alias": alias,
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.getTransientValueReq = function (request, onSuccess, onError) {
            this.apiByName("GetTransientValue", request, onSuccess, onError);
        };
        Serverville.prototype.getTransientValue = function (id, alias, key, onSuccess, onError) {
            this.getTransientValueReq({
                "id": id,
                "alias": alias,
                "key": key
            }, onSuccess, onError);
        };
        Serverville.prototype.getTransientValuesReq = function (request, onSuccess, onError) {
            this.apiByName("GetTransientValues", request, onSuccess, onError);
        };
        Serverville.prototype.getTransientValues = function (id, alias, keys, onSuccess, onError) {
            this.getTransientValuesReq({
                "id": id,
                "alias": alias,
                "keys": keys
            }, onSuccess, onError);
        };
        Serverville.prototype.getAllTransientValuesReq = function (request, onSuccess, onError) {
            this.apiByName("GetAllTransientValues", request, onSuccess, onError);
        };
        Serverville.prototype.getAllTransientValues = function (id, alias, onSuccess, onError) {
            this.getAllTransientValuesReq({
                "id": id,
                "alias": alias
            }, onSuccess, onError);
        };
        Serverville.prototype.joinChannelReq = function (request, onSuccess, onError) {
            this.apiByName("JoinChannel", request, onSuccess, onError);
        };
        Serverville.prototype.joinChannel = function (alias, id, onSuccess, onError) {
            this.joinChannelReq({
                "alias": alias,
                "id": id
            }, onSuccess, onError);
        };
        Serverville.prototype.leaveChannelReq = function (request, onSuccess, onError) {
            this.apiByName("LeaveChannel", request, onSuccess, onError);
        };
        Serverville.prototype.leaveChannel = function (alias, id, onSuccess, onError) {
            this.leaveChannelReq({
                "alias": alias,
                "id": id
            }, onSuccess, onError);
        };
        Serverville.prototype.addAliasToChannelReq = function (request, onSuccess, onError) {
            this.apiByName("AddAliasToChannel", request, onSuccess, onError);
        };
        Serverville.prototype.addAliasToChannel = function (alias, id, onSuccess, onError) {
            this.addAliasToChannelReq({
                "alias": alias,
                "id": id
            }, onSuccess, onError);
        };
        Serverville.prototype.removeAliasFromChannelReq = function (request, onSuccess, onError) {
            this.apiByName("RemoveAliasFromChannel", request, onSuccess, onError);
        };
        Serverville.prototype.removeAliasFromChannel = function (alias, id, onSuccess, onError) {
            this.removeAliasFromChannelReq({
                "alias": alias,
                "id": id
            }, onSuccess, onError);
        };
        Serverville.prototype.listenToChannelReq = function (request, onSuccess, onError) {
            this.apiByName("ListenToChannel", request, onSuccess, onError);
        };
        Serverville.prototype.listenToChannel = function (id, onSuccess, onError) {
            this.listenToChannelReq({
                "id": id
            }, onSuccess, onError);
        };
        Serverville.prototype.stopListenToChannelReq = function (request, onSuccess, onError) {
            this.apiByName("StopListenToChannel", request, onSuccess, onError);
        };
        Serverville.prototype.stopListenToChannel = function (id, onSuccess, onError) {
            this.stopListenToChannelReq({
                "id": id
            }, onSuccess, onError);
        };
        Serverville.prototype.sendClientMessageReq = function (request, onSuccess, onError) {
            this.apiByName("SendClientMessage", request, onSuccess, onError);
        };
        Serverville.prototype.sendClientMessage = function (to, message_type, value, onSuccess, onError) {
            this.sendClientMessageReq({
                "to": to,
                "message_type": message_type,
                "value": value
            }, onSuccess, onError);
        };
        return Serverville;
    }());
    sv.Serverville = Serverville;
})(sv || (sv = {}));
var sv;
(function (sv) {
    var KeyData = (function () {
        function KeyData(server, id) {
            if (server == null)
                throw "Must supply a serverville server";
            if (id == null)
                throw "Data must have an id";
            this.id = id;
            this.server = server;
            this.data = {};
            this.data_info = {};
            this.local_dirty = {};
            this.most_recent = 0;
        }
        KeyData.prototype.loadKeys = function (keys, onDone) {
            var self = this;
            this.server.getDataKeys(this.id, keys, 0, false, function (reply) {
                for (var key in reply.values) {
                    var dataInfo = reply.values[key];
                    self.data_info[dataInfo.key] = dataInfo;
                    self.data[key] = dataInfo.value;
                }
                if (onDone)
                    onDone();
            }, function (reply) {
                if (onDone)
                    onDone();
            });
        };
        KeyData.prototype.loadAll = function (onDone) {
            this.data = {};
            this.local_dirty = {};
            var self = this;
            this.server.getAllDataKeys(this.id, 0, false, function (reply) {
                self.data_info = reply.values;
                for (var key in self.data_info) {
                    var dataInfo = self.data_info[key];
                    self.data[key] = dataInfo.value;
                    if (dataInfo.modified > self.most_recent)
                        self.most_recent = dataInfo.modified;
                }
                if (onDone)
                    onDone();
            }, function (reply) {
                if (onDone)
                    onDone();
            });
        };
        KeyData.prototype.refresh = function (onDone) {
            var self = this;
            this.server.getAllDataKeys(this.id, this.most_recent, true, function (reply) {
                for (var key in self.data_info) {
                    var dataInfo = self.data_info[key];
                    if (dataInfo.deleted) {
                        delete self.data[key];
                        delete self.data_info[key];
                    }
                    else {
                        self.data[key] = dataInfo.value;
                        self.data_info[key] = dataInfo;
                    }
                    if (dataInfo.modified > self.most_recent)
                        self.most_recent = dataInfo.modified;
                }
                if (onDone)
                    onDone();
            }, function (reply) {
                if (onDone)
                    onDone();
            });
        };
        KeyData.prototype.set = function (key, val, data_type) {
            if (data_type === void 0) { data_type = null; }
            var user = this.server.userInfo();
            if (user == null || user.user_id != this.id)
                throw "Read-only data!";
            this.data[key] = val;
            var info = this.data_info[key];
            if (info) {
                info.value = val;
                if (data_type)
                    info.data_type = data_type;
            }
            else {
                info = {
                    "id": this.id,
                    "key": key,
                    "value": val,
                    "data_type": data_type,
                    "created": 0,
                    "modified": 0,
                    "deleted": false
                };
                this.data_info[key] = info;
            }
            this.local_dirty[key] = info;
        };
        KeyData.prototype.save = function (onDone) {
            var user = this.server.userInfo();
            if (user == null || user.user_id != this.id)
                throw "Read-only data!";
            var saveSet = [];
            for (var key in this.local_dirty) {
                var info = this.local_dirty[key];
                saveSet.push({
                    "key": info.key,
                    "value": info.value,
                    "data_type": info.data_type
                });
            }
            this.server.setUserKeys(saveSet, function (reply) {
                this.local_dirty = {};
                if (onDone)
                    onDone();
            }, function (reply) {
                if (onDone)
                    onDone();
            });
        };
        return KeyData;
    }());
    sv.KeyData = KeyData;
})(sv || (sv = {}));
//# sourceMappingURL=serverville.js.map