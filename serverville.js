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
    function makeClientError(code) {
        var msg = "There was an error";
        return { errorCode: code, errorMessage: msg, errorDetails: null };
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
                if (this.LogMessagesToConsole)
                    console.log("HTTP-> " + req.response);
                if (req.status >= 200 && req.status < 400) {
                    var message = JSON.parse(req.response);
                    if (onSuccess) {
                        onSuccess(message);
                    }
                }
                else {
                    var error = JSON.parse(req.response);
                    if (self.GlobalErrorHandler)
                        self.GlobalErrorHandler(error);
                    if (onError)
                        onError(error);
                }
            };
            req.onerror = function (ev) {
                var err = sv_1.makeClientError(1);
                if (self.GlobalErrorHandler)
                    self.GlobalErrorHandler(err);
                if (onError)
                    onError(err);
            };
            req.send(body);
        };
        return HttpTransport;
    })();
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
            this.ServerSocket = new WebSocket(this.SV.ServerURL);
            this.ServerSocket.onopen = function (evt) {
                onConnected(null);
            };
            this.ServerSocket.onclose = this.onWSClosed;
            this.ServerSocket.onmessage = this.onWSMessage;
            this.ServerSocket.onerror = function (evt) {
                if (onConnected != null) {
                    onConnected(sv_2.makeClientError(1));
                }
            };
        };
        WebSocketTransport.prototype.callApi = function (api, request, onSuccess, onError) {
            var messageNum = (this.MessageSequence++).toString();
            var message = api + ":" + messageNum + ":" + JSON.stringify(request);
            if (this.SV.LogMessagesToConsole)
                console.log("WS<- " + message);
            var callback = function (isError, reply) {
                if (isError) {
                    if (onError)
                        onError(reply);
                }
                else {
                    if (onSuccess)
                        onSuccess(reply);
                }
            };
            this.ReplyCallbacks[messageNum] = callback;
            this.ServerSocket.send(message);
        };
        WebSocketTransport.prototype.onWSClosed = function (evt) {
            console.log("Web socket closed");
        };
        WebSocketTransport.prototype.onWSMessage = function (evt) {
            var messageStr = evt.data;
            if (this.SV.LogMessagesToConsole)
                console.log("WS-> " + messageStr);
            var split1 = messageStr.indexOf(":");
            if (split1 < 0) {
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
                var messageId = messageStr.substring(split1 + 1, split2);
                var messageFrom = messageStr.substring(split2 + 1, split3);
                var messageJson = messageStr.substring(split3 + 1);
                var messageData = JSON.parse(messageJson);
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
    })();
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
            }
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
        Serverville.prototype.signInReq = function (request, onSuccess, onError) {
            var self = this;
            this.Transport.callApi("SignIn", request, function (reply) { self.setUserInfo(reply); if (onSuccess) {
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
            this.Transport.callApi("ValidateSession", request, function (reply) { self.setUserInfo(reply); if (onSuccess) {
                onSuccess(reply);
            } }, onError);
        };
        Serverville.prototype.validateSession = function (session_id, onSuccess, onError) {
            this.validateSessionReq({
                "session_id": session_id
            }, onSuccess, onError);
        };
        Serverville.prototype.createAnonymousAccountReq = function (request, onSuccess, onError) {
            this.Transport.callApi("CreateAnonymousAccount", request, onSuccess, onError);
        };
        Serverville.prototype.createAnonymousAccount = function (onSuccess, onError) {
            this.createAnonymousAccountReq({}, onSuccess, onError);
        };
        Serverville.prototype.createAccountReq = function (request, onSuccess, onError) {
            this.Transport.callApi("CreateAccount", request, onSuccess, onError);
        };
        Serverville.prototype.createAccount = function (username, email, password, onSuccess, onError) {
            this.createAccountReq({
                "username": username,
                "email": email,
                "password": password
            }, onSuccess, onError);
        };
        Serverville.prototype.convertToFullAccountReq = function (request, onSuccess, onError) {
            this.Transport.callApi("ConvertToFullAccount", request, onSuccess, onError);
        };
        Serverville.prototype.convertToFullAccount = function (username, email, password, onSuccess, onError) {
            this.convertToFullAccountReq({
                "username": username,
                "email": email,
                "password": password
            }, onSuccess, onError);
        };
        Serverville.prototype.getUserInfoReq = function (request, onSuccess, onError) {
            var self = this;
            this.Transport.callApi("GetUserInfo", request, function (reply) { self.setUserInfo(reply); if (onSuccess) {
                onSuccess(reply);
            } }, onError);
        };
        Serverville.prototype.getUserInfo = function (onSuccess, onError) {
            this.getUserInfoReq({}, onSuccess, onError);
        };
        Serverville.prototype.setUserKeyReq = function (request, onSuccess, onError) {
            this.Transport.callApi("SetUserKey", request, onSuccess, onError);
        };
        Serverville.prototype.setUserKey = function (key, value, data_type, onSuccess, onError) {
            this.setUserKeyReq({
                "key": key,
                "value": value,
                "data_type": data_type
            }, onSuccess, onError);
        };
        Serverville.prototype.setUserKeysReq = function (request, onSuccess, onError) {
            this.Transport.callApi("SetUserKeys", request, onSuccess, onError);
        };
        Serverville.prototype.setUserKeys = function (values, onSuccess, onError) {
            this.setUserKeysReq({
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.getUserKeyReq = function (request, onSuccess, onError) {
            this.Transport.callApi("GetUserKey", request, onSuccess, onError);
        };
        Serverville.prototype.getUserKey = function (key, onSuccess, onError) {
            this.getUserKeyReq({
                "key": key
            }, onSuccess, onError);
        };
        Serverville.prototype.getUserKeysReq = function (request, onSuccess, onError) {
            this.Transport.callApi("GetUserKeys", request, onSuccess, onError);
        };
        Serverville.prototype.getUserKeys = function (keys, since, onSuccess, onError) {
            this.getUserKeysReq({
                "keys": keys,
                "since": since
            }, onSuccess, onError);
        };
        Serverville.prototype.getAllUserKeysReq = function (request, onSuccess, onError) {
            this.Transport.callApi("GetAllUserKeys", request, onSuccess, onError);
        };
        Serverville.prototype.getAllUserKeys = function (since, onSuccess, onError) {
            this.getAllUserKeysReq({
                "since": since
            }, onSuccess, onError);
        };
        Serverville.prototype.getDataKeyReq = function (request, onSuccess, onError) {
            this.Transport.callApi("GetDataKey", request, onSuccess, onError);
        };
        Serverville.prototype.getDataKey = function (id, key, onSuccess, onError) {
            this.getDataKeyReq({
                "id": id,
                "key": key
            }, onSuccess, onError);
        };
        Serverville.prototype.getDataKeysReq = function (request, onSuccess, onError) {
            this.Transport.callApi("GetDataKeys", request, onSuccess, onError);
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
            this.Transport.callApi("GetAllDataKeys", request, onSuccess, onError);
        };
        Serverville.prototype.getAllDataKeys = function (id, since, include_deleted, onSuccess, onError) {
            this.getAllDataKeysReq({
                "id": id,
                "since": since,
                "include_deleted": include_deleted
            }, onSuccess, onError);
        };
        Serverville.prototype.setTransientValueReq = function (request, onSuccess, onError) {
            this.Transport.callApi("SetTransientValue", request, onSuccess, onError);
        };
        Serverville.prototype.setTransientValue = function (key, value, data_type, onSuccess, onError) {
            this.setTransientValueReq({
                "key": key,
                "value": value,
                "data_type": data_type
            }, onSuccess, onError);
        };
        Serverville.prototype.setTransientValuesReq = function (request, onSuccess, onError) {
            this.Transport.callApi("SetTransientValues", request, onSuccess, onError);
        };
        Serverville.prototype.setTransientValues = function (values, onSuccess, onError) {
            this.setTransientValuesReq({
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.getTransientValueReq = function (request, onSuccess, onError) {
            this.Transport.callApi("GetTransientValue", request, onSuccess, onError);
        };
        Serverville.prototype.getTransientValue = function (id, key, onSuccess, onError) {
            this.getTransientValueReq({
                "id": id,
                "key": key
            }, onSuccess, onError);
        };
        Serverville.prototype.getTransientValuesReq = function (request, onSuccess, onError) {
            this.Transport.callApi("GetTransientValues", request, onSuccess, onError);
        };
        Serverville.prototype.getTransientValues = function (id, keys, onSuccess, onError) {
            this.getTransientValuesReq({
                "id": id,
                "keys": keys
            }, onSuccess, onError);
        };
        Serverville.prototype.getAllTransientValuesReq = function (request, onSuccess, onError) {
            this.Transport.callApi("getAllTransientValues", request, onSuccess, onError);
        };
        Serverville.prototype.getAllTransientValues = function (id, onSuccess, onError) {
            this.getAllTransientValuesReq({
                "id": id
            }, onSuccess, onError);
        };
        Serverville.prototype.getChannelInfoReq = function (request, onSuccess, onError) {
            this.Transport.callApi("GetChannelInfo", request, onSuccess, onError);
        };
        Serverville.prototype.getChannelInfo = function (id, listen_only, onSuccess, onError) {
            this.getChannelInfoReq({
                "id": id,
                "listen_only": listen_only
            }, onSuccess, onError);
        };
        Serverville.prototype.joinChannelReq = function (request, onSuccess, onError) {
            this.Transport.callApi("JoinChannel", request, onSuccess, onError);
        };
        Serverville.prototype.joinChannel = function (id, listen_only, onSuccess, onError) {
            this.joinChannelReq({
                "id": id,
                "listen_only": listen_only
            }, onSuccess, onError);
        };
        Serverville.prototype.leaveChannelReq = function (request, onSuccess, onError) {
            this.Transport.callApi("LeaveChannel", request, onSuccess, onError);
        };
        Serverville.prototype.leaveChannel = function (id, onSuccess, onError) {
            this.leaveChannelReq({
                "id": id
            }, onSuccess, onError);
        };
        Serverville.prototype.sendClientMessageReq = function (request, onSuccess, onError) {
            this.Transport.callApi("SendClientMessage", request, onSuccess, onError);
        };
        Serverville.prototype.sendClientMessage = function (to, message_type, value, data_type, onSuccess, onError) {
            this.sendClientMessageReq({
                "to": to,
                "message_type": message_type,
                "value": value,
                "data_type": data_type
            }, onSuccess, onError);
        };
        return Serverville;
    })();
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
        KeyData.prototype.loadAll = function (onDone) {
            this.data = {};
            this.local_dirty = {};
            var self = this;
            this.server.getAllDataKeys(this.id, 0, true, function (reply) {
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
                self.data_info = reply.values;
                for (var key in self.data_info) {
                    var dataInfo = self.data_info[key];
                    if (dataInfo.deleted) {
                        delete self.data[key];
                    }
                    else {
                        self.data[key] = dataInfo.value;
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
            if (this.server.UserInfo == null || this.server.UserInfo.user_id != this.id)
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
            if (this.server.UserInfo == null || this.server.UserInfo.user_id != this.id)
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
    })();
    sv.KeyData = KeyData;
})(sv || (sv = {}));
//# sourceMappingURL=serverville.js.map