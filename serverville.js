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
            this.doPost(this.SV.ServerURL + "/api/" + api, request, onSuccess, onError);
        };
        HttpTransport.prototype.doPost = function (url, request, onSuccess, onError) {
            var req = new XMLHttpRequest();
            req.open("POST", url);
            if (this.SV.SessionId)
                req.setRequestHeader("Authorization", this.SV.SessionId);
            req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            var body = JSON.stringify(request);
            if (this.SV.LogMessagesToConsole)
                console.log("HTTP<- " + body);
            var self = this;
            req.onload = function (ev) {
                if (self.SV.LogMessagesToConsole)
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
                        self.SV._onServerError(error);
                }
                if (req.getResponseHeader("X-Notifications")) {
                    // Pending notifications from the server!
                    self.getNotifications();
                }
            };
            req.onerror = function (ev) {
                var err = sv_1.makeClientError(-2);
                if (onError)
                    onError(err);
                else
                    self.SV._onServerError(err);
            };
            req.send(body);
        };
        HttpTransport.prototype.close = function () {
        };
        HttpTransport.prototype.getNotifications = function () {
            var url = this.SV.ServerURL + "/notifications";
            var onSuccess = function (reply) {
                if (!reply.notifications)
                    return;
                for (var i = 0; i < reply.notifications.length; i++) {
                    var note = reply.notifications[i];
                    this.SV._onServerNotification(note.notification_type, note.body);
                }
            };
            var onError = function (err) {
                console.log("Error retreiving notifications: " + err.errorMessage);
            };
            this.doPost(url, {}, onSuccess, onError);
        };
        HttpTransport.unauthedRequest = function (url, request, onSuccess, onError) {
            var req = new XMLHttpRequest();
            req.open("POST", url);
            req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            var body = JSON.stringify(request);
            req.onload = function (ev) {
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
                }
            };
            req.onerror = function (ev) {
                var err = sv_1.makeClientError(-2);
                if (onError)
                    onError(err);
            };
            req.send(body);
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
                self.Connected = true;
                onConnected(null);
            };
            this.ServerSocket.onclose = function (evt) {
                self.onWSClosed(evt);
                self.Connected = false;
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
            this.Connected = false;
            if (this.ServerSocket)
                this.ServerSocket.close();
        };
        WebSocketTransport.prototype.onWSClosed = function (evt) {
            if (this.Connected == false) {
                // Ignore close when we never actually got open first
                return;
            }
            console.log("Web socket closed");
            this.Connected = false;
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
            if (messageType == "N") {
                // Server push message
                var split2 = messageStr.indexOf(":", split1 + 1);
                if (split2 < 0) {
                    console.log("Incorrectly formatted message");
                    return;
                }
                var notificationType = messageStr.substring(split1 + 1, split2);
                var notificationJson = messageStr.substring(split2 + 1);
                this.SV._onServerNotification(notificationType, notificationJson);
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
            this.UserMessageTypeHandlers = {};
            this.LastSend = 0;
            this.PingTimer = 0;
            this.LastServerTime = 0;
            this.LastServerTimeAt = 0;
            this.SessionId = localStorage.getItem("SessionId");
            this.initServerUrl(url);
        }
        Serverville.prototype.initServerUrl = function (url) {
            this.ServerURL = url;
            var protocolLen = this.ServerURL.indexOf("://");
            if (protocolLen < 2)
                throw "Malformed url: " + url;
            this.ServerHost = this.ServerURL.substring(protocolLen + 3);
            this.ServerProtocol = this.ServerURL.substring(0, protocolLen);
            if (this.ServerProtocol == "ws" || this.ServerProtocol == "wss") {
                this.Transport = new sv.WebSocketTransport(this);
            }
            else if (this.ServerProtocol == "http" || this.ServerProtocol == "https") {
                this.Transport = new sv.HttpTransport(this);
            }
            else {
                throw "Unknown server protocol: " + url;
            }
        };
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
        Serverville.prototype.initWithResidentId = function (resId, onComplete) {
            if (!resId) {
                this.init(onComplete);
                return;
            }
            var serverUrl = this.ServerURL;
            if (this.ServerProtocol == "ws")
                serverUrl = "http://" + this.ServerHost;
            else if (this.ServerProtocol == "wss")
                serverUrl = "https://" + this.ServerHost;
            serverUrl += "/api/GetHostWithResident";
            var req = {
                resident_id: resId
            };
            var self = this;
            sv.HttpTransport.unauthedRequest(serverUrl, req, function (reply) {
                var url = self.fixupServerURL(reply.host);
                self.initServerUrl(url);
                self.init(onComplete);
            }, function (err) {
                onComplete(null, err);
            });
        };
        Serverville.prototype.fixupServerURL = function (host) {
            var url = host;
            if (host.indexOf("://") < 0) {
                url = this.ServerProtocol + "://" + host;
            }
            return url;
        };
        Serverville.prototype.switchHosts = function (host, onComplete) {
            var url = this.fixupServerURL(host);
            if (this.ServerURL == url) {
                onComplete(null);
                return;
            }
            this.shutdown();
            this.initServerUrl(url);
            this.init(function (user, err) {
                onComplete(err);
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
        Serverville.prototype.setUserSession = function (sessionId) {
            this.SessionId = sessionId;
            localStorage.setItem("SessionId", this.SessionId);
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
        Serverville.prototype._onServerNotification = function (notificationType, notificationJson) {
            var notification = JSON.parse(notificationJson);
            switch (notificationType) {
                case "error":
                    // Pushed error
                    this._onServerError(notification);
                    return;
                case "msg":
                    // User message
                    this._onUserMessage(notification);
                    return;
                case "resJoined":
                    if (this.ResidentJoinedHandler)
                        this.ResidentJoinedHandler(notification);
                    return;
                case "resLeft":
                    if (this.ResidentLeftHandler)
                        this.ResidentLeftHandler(notification);
                    return;
                case "resEvent":
                    if (this.ResidentEventHandler)
                        this.ResidentEventHandler(notification);
                    return;
                case "resUpdate":
                    if (this.ResidentStateUpdateHandler)
                        this.ResidentStateUpdateHandler(notification);
                    return;
                default:
                    console.log("Unknown type of server notification: " + notificationType);
                    return;
            }
        };
        Serverville.prototype._onUserMessage = function (message) {
            var typeHandler = this.UserMessageTypeHandlers[message.message_type];
            if (typeHandler != null) {
                typeHandler(message);
            }
            else if (this.UserMessageHandler != null) {
                this.UserMessageHandler(message);
            }
            else {
                console.log("No handler for message " + message.message_type);
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
            this.stopPingHeartbeat();
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
        Serverville.prototype.createAnonymousAccount = function (invite_code, language, country, onSuccess, onError) {
            this.createAnonymousAccountReq({
                "invite_code": invite_code,
                "language": language,
                "country": country
            }, onSuccess, onError);
        };
        Serverville.prototype.createAccountReq = function (request, onSuccess, onError) {
            var self = this;
            this.apiByName("CreateAccount", request, function (reply) { self.setUserInfo(reply); if (onSuccess) {
                onSuccess(reply);
            } }, onError);
        };
        Serverville.prototype.createAccount = function (username, email, password, invite_code, language, country, onSuccess, onError) {
            this.createAccountReq({
                "username": username,
                "email": email,
                "password": password,
                "invite_code": invite_code,
                "language": language,
                "country": country
            }, onSuccess, onError);
        };
        Serverville.prototype.convertToFullAccountReq = function (request, onSuccess, onError) {
            var self = this;
            this.apiByName("ConvertToFullAccount", request, function (reply) { self.setUserInfo(reply); if (onSuccess) {
                onSuccess(reply);
            } }, onError);
        };
        Serverville.prototype.convertToFullAccount = function (username, email, password, invite_code, language, country, onSuccess, onError) {
            this.convertToFullAccountReq({
                "username": username,
                "email": email,
                "password": password,
                "invite_code": invite_code,
                "language": language,
                "country": country
            }, onSuccess, onError);
        };
        Serverville.prototype.changePasswordReq = function (request, onSuccess, onError) {
            var self = this;
            this.apiByName("ChangePassword", request, function (reply) { self.setUserSession(reply.session_id); if (onSuccess) {
                onSuccess(reply);
            } }, onError);
        };
        Serverville.prototype.changePassword = function (old_password, new_password, onSuccess, onError) {
            this.changePasswordReq({
                "old_password": old_password,
                "new_password": new_password
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
        Serverville.prototype.setLocaleReq = function (request, onSuccess, onError) {
            this.apiByName("SetLocale", request, onSuccess, onError);
        };
        Serverville.prototype.setLocale = function (country, language, onSuccess, onError) {
            this.setLocaleReq({
                "country": country,
                "language": language
            }, onSuccess, onError);
        };
        Serverville.prototype.getUserDataComboReq = function (request, onSuccess, onError) {
            this.apiByName("GetUserDataCombo", request, onSuccess, onError);
        };
        Serverville.prototype.getUserDataCombo = function (since, onSuccess, onError) {
            this.getUserDataComboReq({
                "since": since
            }, onSuccess, onError);
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
        Serverville.prototype.pageAllDataKeysReq = function (request, onSuccess, onError) {
            this.apiByName("PageAllDataKeys", request, onSuccess, onError);
        };
        Serverville.prototype.pageAllDataKeys = function (id, page_size, start_after, descending, onSuccess, onError) {
            this.pageAllDataKeysReq({
                "id": id,
                "page_size": page_size,
                "start_after": start_after,
                "descending": descending
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
        Serverville.prototype.getKeyDataRecordsReq = function (request, onSuccess, onError) {
            this.apiByName("GetKeyDataRecords", request, onSuccess, onError);
        };
        Serverville.prototype.getKeyDataRecords = function (record_type, parent, onSuccess, onError) {
            this.getKeyDataRecordsReq({
                "record_type": record_type,
                "parent": parent
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
        Serverville.prototype.getHostWithResidentReq = function (request, onSuccess, onError) {
            this.apiByName("GetHostWithResident", request, onSuccess, onError);
        };
        Serverville.prototype.getHostWithResident = function (resident_id, onSuccess, onError) {
            this.getHostWithResidentReq({
                "resident_id": resident_id
            }, onSuccess, onError);
        };
        Serverville.prototype.createResidentReq = function (request, onSuccess, onError) {
            this.apiByName("CreateResident", request, onSuccess, onError);
        };
        Serverville.prototype.createResident = function (resident_type, values, onSuccess, onError) {
            this.createResidentReq({
                "resident_type": resident_type,
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.deleteResidentReq = function (request, onSuccess, onError) {
            this.apiByName("DeleteResident", request, onSuccess, onError);
        };
        Serverville.prototype.deleteResident = function (resident_id, final_values, onSuccess, onError) {
            this.deleteResidentReq({
                "resident_id": resident_id,
                "final_values": final_values
            }, onSuccess, onError);
        };
        Serverville.prototype.removeResidentFromAllChannelsReq = function (request, onSuccess, onError) {
            this.apiByName("RemoveResidentFromAllChannels", request, onSuccess, onError);
        };
        Serverville.prototype.removeResidentFromAllChannels = function (resident_id, final_values, onSuccess, onError) {
            this.removeResidentFromAllChannelsReq({
                "resident_id": resident_id,
                "final_values": final_values
            }, onSuccess, onError);
        };
        Serverville.prototype.setTransientValueReq = function (request, onSuccess, onError) {
            this.apiByName("SetTransientValue", request, onSuccess, onError);
        };
        Serverville.prototype.setTransientValue = function (resident_id, key, value, onSuccess, onError) {
            this.setTransientValueReq({
                "resident_id": resident_id,
                "key": key,
                "value": value
            }, onSuccess, onError);
        };
        Serverville.prototype.setTransientValuesReq = function (request, onSuccess, onError) {
            this.apiByName("SetTransientValues", request, onSuccess, onError);
        };
        Serverville.prototype.setTransientValues = function (resident_id, values, onSuccess, onError) {
            this.setTransientValuesReq({
                "resident_id": resident_id,
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.deleteTransientValueReq = function (request, onSuccess, onError) {
            this.apiByName("DeleteTransientValue", request, onSuccess, onError);
        };
        Serverville.prototype.deleteTransientValue = function (resident_id, key, onSuccess, onError) {
            this.deleteTransientValueReq({
                "resident_id": resident_id,
                "key": key
            }, onSuccess, onError);
        };
        Serverville.prototype.deleteTransientValuesReq = function (request, onSuccess, onError) {
            this.apiByName("DeleteTransientValues", request, onSuccess, onError);
        };
        Serverville.prototype.deleteTransientValues = function (resident_id, values, onSuccess, onError) {
            this.deleteTransientValuesReq({
                "resident_id": resident_id,
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.getTransientValueReq = function (request, onSuccess, onError) {
            this.apiByName("GetTransientValue", request, onSuccess, onError);
        };
        Serverville.prototype.getTransientValue = function (resident_id, key, onSuccess, onError) {
            this.getTransientValueReq({
                "resident_id": resident_id,
                "key": key
            }, onSuccess, onError);
        };
        Serverville.prototype.getTransientValuesReq = function (request, onSuccess, onError) {
            this.apiByName("GetTransientValues", request, onSuccess, onError);
        };
        Serverville.prototype.getTransientValues = function (resident_id, keys, onSuccess, onError) {
            this.getTransientValuesReq({
                "resident_id": resident_id,
                "keys": keys
            }, onSuccess, onError);
        };
        Serverville.prototype.getAllTransientValuesReq = function (request, onSuccess, onError) {
            this.apiByName("GetAllTransientValues", request, onSuccess, onError);
        };
        Serverville.prototype.getAllTransientValues = function (resident_id, onSuccess, onError) {
            this.getAllTransientValuesReq({
                "resident_id": resident_id
            }, onSuccess, onError);
        };
        Serverville.prototype.joinChannelReq = function (request, onSuccess, onError) {
            this.apiByName("JoinChannel", request, onSuccess, onError);
        };
        Serverville.prototype.joinChannel = function (channel_id, resident_id, values, onSuccess, onError) {
            this.joinChannelReq({
                "channel_id": channel_id,
                "resident_id": resident_id,
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.leaveChannelReq = function (request, onSuccess, onError) {
            this.apiByName("LeaveChannel", request, onSuccess, onError);
        };
        Serverville.prototype.leaveChannel = function (channel_id, resident_id, final_values, onSuccess, onError) {
            this.leaveChannelReq({
                "channel_id": channel_id,
                "resident_id": resident_id,
                "final_values": final_values
            }, onSuccess, onError);
        };
        Serverville.prototype.addResidentToChannelReq = function (request, onSuccess, onError) {
            this.apiByName("AddResidentToChannel", request, onSuccess, onError);
        };
        Serverville.prototype.addResidentToChannel = function (channel_id, resident_id, values, onSuccess, onError) {
            this.addResidentToChannelReq({
                "channel_id": channel_id,
                "resident_id": resident_id,
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.removeResidentFromChannelReq = function (request, onSuccess, onError) {
            this.apiByName("RemoveResidentFromChannel", request, onSuccess, onError);
        };
        Serverville.prototype.removeResidentFromChannel = function (channel_id, resident_id, final_values, onSuccess, onError) {
            this.removeResidentFromChannelReq({
                "channel_id": channel_id,
                "resident_id": resident_id,
                "final_values": final_values
            }, onSuccess, onError);
        };
        Serverville.prototype.listenToChannelReq = function (request, onSuccess, onError) {
            this.apiByName("ListenToChannel", request, onSuccess, onError);
        };
        Serverville.prototype.listenToChannel = function (channel_id, onSuccess, onError) {
            this.listenToChannelReq({
                "channel_id": channel_id
            }, onSuccess, onError);
        };
        Serverville.prototype.stopListenToChannelReq = function (request, onSuccess, onError) {
            this.apiByName("StopListenToChannel", request, onSuccess, onError);
        };
        Serverville.prototype.stopListenToChannel = function (channel_id, onSuccess, onError) {
            this.stopListenToChannelReq({
                "channel_id": channel_id
            }, onSuccess, onError);
        };
        Serverville.prototype.triggerResidentEventReq = function (request, onSuccess, onError) {
            this.apiByName("TriggerResidentEvent", request, onSuccess, onError);
        };
        Serverville.prototype.triggerResidentEvent = function (resident_id, event_type, event_data, onSuccess, onError) {
            this.triggerResidentEventReq({
                "resident_id": resident_id,
                "event_type": event_type,
                "event_data": event_data
            }, onSuccess, onError);
        };
        Serverville.prototype.sendUserMessageReq = function (request, onSuccess, onError) {
            this.apiByName("SendUserMessage", request, onSuccess, onError);
        };
        Serverville.prototype.sendUserMessage = function (to, message_type, message, guaranteed, onSuccess, onError) {
            this.sendUserMessageReq({
                "to": to,
                "message_type": message_type,
                "message": message,
                "guaranteed": guaranteed
            }, onSuccess, onError);
        };
        Serverville.prototype.getPendingMessagesReq = function (request, onSuccess, onError) {
            this.apiByName("GetPendingMessages", request, onSuccess, onError);
        };
        Serverville.prototype.getPendingMessages = function (onSuccess, onError) {
            this.getPendingMessagesReq({}, onSuccess, onError);
        };
        Serverville.prototype.clearPendingMessageReq = function (request, onSuccess, onError) {
            this.apiByName("ClearPendingMessage", request, onSuccess, onError);
        };
        Serverville.prototype.clearPendingMessage = function (id, onSuccess, onError) {
            this.clearPendingMessageReq({
                "id": id
            }, onSuccess, onError);
        };
        Serverville.prototype.getCurrencyBalanceReq = function (request, onSuccess, onError) {
            this.apiByName("GetCurrencyBalance", request, onSuccess, onError);
        };
        Serverville.prototype.getCurrencyBalance = function (currency_id, onSuccess, onError) {
            this.getCurrencyBalanceReq({
                "currency_id": currency_id
            }, onSuccess, onError);
        };
        Serverville.prototype.getCurrencyBalancesReq = function (request, onSuccess, onError) {
            this.apiByName("GetCurrencyBalances", request, onSuccess, onError);
        };
        Serverville.prototype.getCurrencyBalances = function (onSuccess, onError) {
            this.getCurrencyBalancesReq({}, onSuccess, onError);
        };
        Serverville.prototype.getProductsReq = function (request, onSuccess, onError) {
            this.apiByName("GetProducts", request, onSuccess, onError);
        };
        Serverville.prototype.getProducts = function (onSuccess, onError) {
            this.getProductsReq({}, onSuccess, onError);
        };
        Serverville.prototype.getProductReq = function (request, onSuccess, onError) {
            this.apiByName("GetProduct", request, onSuccess, onError);
        };
        Serverville.prototype.getProduct = function (product_id, onSuccess, onError) {
            this.getProductReq({
                "product_id": product_id
            }, onSuccess, onError);
        };
        Serverville.prototype.stripeCheckoutReq = function (request, onSuccess, onError) {
            this.apiByName("stripeCheckout", request, onSuccess, onError);
        };
        Serverville.prototype.stripeCheckout = function (stripe_token, product_id, onSuccess, onError) {
            this.stripeCheckoutReq({
                "stripe_token": stripe_token,
                "product_id": product_id
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
                for (var key in reply.values) {
                    var dataInfo = reply.values[key];
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
var sv;
(function (sv) {
    function makeStripeButton(server, apiKey, product, successUrl, failUrl) {
        var form = document.createElement("form");
        form.method = "POST";
        form.action = "https://" + server.ServerHost + "/form/stripeCheckout";
        var sessionToken = document.createElement("input");
        sessionToken.type = "hidden";
        sessionToken.name = "session_id";
        sessionToken.value = server.SessionId;
        form.appendChild(sessionToken);
        var productInput = document.createElement("input");
        productInput.type = "hidden";
        productInput.name = "product_id";
        productInput.value = product.id;
        form.appendChild(productInput);
        var successUrlInput = document.createElement("input");
        successUrlInput.type = "hidden";
        successUrlInput.name = "success_redirect_url";
        successUrlInput.value = successUrl;
        form.appendChild(successUrlInput);
        var failUrlInput = document.createElement("input");
        failUrlInput.type = "hidden";
        failUrlInput.name = "fail_redirect_url";
        failUrlInput.value = failUrl;
        form.appendChild(failUrlInput);
        var script = document.createElement("script");
        script.classList.add("stripe-button");
        script.setAttribute("data-key", apiKey);
        script.setAttribute("data-amount", String(product.price));
        script.setAttribute("data-name", product.name);
        script.setAttribute("data-description", product.description);
        script.setAttribute("data-image", product.image_url);
        script.setAttribute("data-locale", "auto");
        script.setAttribute("data-zip-code", "true");
        script.setAttribute("data-billing-address", "true");
        script.src = "https://checkout.stripe.com/checkout.js";
        form.appendChild(script);
        return form;
    }
    sv.makeStripeButton = makeStripeButton;
})(sv || (sv = {}));
//# sourceMappingURL=serverville.js.map