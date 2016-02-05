var sv;
(function (sv) {
    var Serverville = (function () {
        function Serverville(url) {
            this.MessageSequence = 0;
            this.ReplyCallbacks = {};
            this.LogMessagesToConsole = false;
            this.ServerURL = url;
            this.SessionId = localStorage.getItem("SessionId");
        }
        Serverville.prototype.init = function (onComplete) {
            var self = this;
            if (this.usingWebsocket()) {
                this.ServerSocket = new WebSocket(this.ServerURL);
                this.ServerSocket.onopen = function (evt) {
                    if (self.SessionId) {
                        self.validateSession(self.SessionId, onComplete, function (reply) {
                            self.signOut();
                            onComplete(null);
                        });
                    }
                    else {
                        onComplete(null);
                    }
                };
                this.ServerSocket.onclose = function (evt) {
                    self.onWSClosed(evt);
                };
                this.ServerSocket.onmessage = function (evt) {
                    self.onWSMessage(evt);
                };
                this.ServerSocket.onerror = function (evt) {
                    onComplete(null);
                };
                return;
            }
            if (this.SessionId) {
                this.getUserInfo(onComplete, function (reply) {
                    self.signOut();
                    onComplete(null);
                });
            }
            else {
                onComplete(null);
            }
        };
        Serverville.prototype.onWSClosed = function (evt) {
            console.log("Web socket closed");
        };
        Serverville.prototype.onWSMessage = function (evt) {
            var messageStr = evt.data;
            if (this.LogMessagesToConsole)
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
                if (this.ServerMessageHandler != null) {
                    var handler = this.ServerMessageHandler[messageId];
                    if (handler == null) {
                        console.log("No handler for message of type " + messageId);
                        return;
                    }
                    handler(messageFrom, messageData);
                }
            }
            else if (messageType == "E" || messageType == "R") {
                // Reply
                var split2 = messageStr.indexOf(":", split1 + 1);
                if (split2 < 0) {
                    console.log("Incorrectly formatted message");
                    return;
                }
                var messageNum = parseInt(messageStr.substring(split1 + 1, split2));
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
        Serverville.prototype.usingWebsocket = function () {
            return this.ServerURL.substr(0, 5) == "ws://";
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
            var data = new KeyData(this, this.UserInfo.user_id);
            data.loadAll(onDone);
            return data;
        };
        Serverville.prototype.loadKeyData = function (id, onDone) {
            var data = new KeyData(this, id);
            data.loadAll(onDone);
            return data;
        };
        Serverville.prototype.callJsonApi = function (api, request, onSuccess, onError) {
            if (this.ServerSocket) {
                this.callWSJsonApi(api, request, onSuccess, onError);
            }
            else {
                this.callHTTPJsonApi(api, request, onSuccess, onError);
            }
        };
        Serverville.prototype.callHTTPJsonApi = function (api, request, onSuccess, onError) {
            var req = new XMLHttpRequest();
            req.open("POST", this.ServerURL + "/api/" + api);
            if (this.SessionId)
                req.setRequestHeader("Authorization", this.SessionId);
            req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            var body = JSON.stringify(request);
            if (this.LogMessagesToConsole)
                console.log("HTTP<- " + body);
            var self = this;
            req.onload = function (ev) {
                if (this.LogMessagesToConsole)
                    console.log("HTTP-> " + req.response);
                if (req.status >= 200 && req.status < 400) {
                    var envelope = JSON.parse(req.response);
                    if (onSuccess) {
                        onSuccess(envelope.message);
                    }
                }
                else {
                    if (self.GlobalErrorHandler)
                        self.GlobalErrorHandler(null);
                    if (onError)
                        onError(null);
                }
            };
            req.onerror = function (ev) {
                if (self.GlobalErrorHandler)
                    self.GlobalErrorHandler(ev);
                if (onError)
                    onError(ev);
            };
            req.send(body);
        };
        Serverville.prototype.callWSJsonApi = function (api, request, onSuccess, onError) {
            var messageNum = this.MessageSequence++;
            var message = api + ":" + messageNum.toString() + ":" + JSON.stringify(request);
            if (this.LogMessagesToConsole)
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
        Serverville.prototype.isSignedIn = function () {
            return this.SessionId != null;
        };
        Serverville.prototype.validateSession = function (session_id, onSuccess, onError) {
            var self = this;
            this.callJsonApi("ValidateSession", {
                "session_id": session_id
            }, function (reply) {
                self.setUserInfo(reply);
                if (onSuccess)
                    onSuccess(reply);
            }, onError);
        };
        Serverville.prototype.signIn = function (username, email, password, onSuccess, onError) {
            var self = this;
            this.callJsonApi("SignIn", {
                "username": username,
                "email": email,
                "password": password
            }, function (reply) {
                self.setUserInfo(reply);
                if (onSuccess)
                    onSuccess(reply);
            }, onError);
        };
        Serverville.prototype.signOut = function () {
            this.setUserInfo(null);
        };
        Serverville.prototype.createAccount = function (username, email, password, onSuccess, onError) {
            var self = this;
            this.callJsonApi("CreateAccount", {
                "username": username,
                "email": email,
                "password": password
            }, function (reply) {
                self.setUserInfo(reply);
                if (onSuccess)
                    onSuccess(reply);
            }, onError);
        };
        Serverville.prototype.createAnonymousAccount = function (onSuccess, onError) {
            var self = this;
            this.callJsonApi("CreateAnonymousAccount", {}, function (reply) {
                self.setUserInfo(reply);
                if (onSuccess)
                    onSuccess(reply);
            }, onError);
        };
        Serverville.prototype.convertToFullAccount = function (username, email, password, onSuccess, onError) {
            var self = this;
            this.callJsonApi("ConvertToFullAccount", {
                "username": username,
                "email": email,
                "password": password
            }, function (reply) {
                self.setUserInfo(reply);
                if (onSuccess)
                    onSuccess(reply);
            }, onError);
        };
        Serverville.prototype.getUserInfo = function (onSuccess, onError) {
            var self = this;
            this.callJsonApi("GetUserInfo", {}, function (reply) {
                self.setUserInfo(reply);
                if (onSuccess)
                    onSuccess(reply);
            }, onError);
        };
        Serverville.prototype.setUserKey = function (request, onSuccess, onError) {
            var self = this;
            this.callJsonApi("SetUserKey", request, onSuccess, onError);
        };
        Serverville.prototype.setUserKeys = function (values, onSuccess, onError) {
            var self = this;
            this.callJsonApi("SetUserKeys", {
                "values": values
            }, onSuccess, onError);
        };
        Serverville.prototype.getUserKey = function (key, onSuccess, onError) {
            var self = this;
            this.callJsonApi("GetUserKey", {
                "key": key
            }, onSuccess, onError);
        };
        Serverville.prototype.getUserKeys = function (keys, since, onSuccess, onError) {
            var self = this;
            this.callJsonApi("GetUserKeys", {
                "keys": keys,
                "since": since
            }, onSuccess, onError);
        };
        Serverville.prototype.getAllUserKeys = function (since, onSuccess, onError) {
            var self = this;
            this.callJsonApi("GetAllUserKeys", {
                "since": since
            }, onSuccess, onError);
        };
        Serverville.prototype.getDataKey = function (id, key, onSuccess, onError) {
            var self = this;
            this.callJsonApi("GetDataKey", {
                "id": id,
                "key": key
            }, onSuccess, onError);
        };
        Serverville.prototype.getDataKeys = function (id, keys, options, onSuccess, onError) {
            if (options == null)
                options = {};
            var self = this;
            this.callJsonApi("GetDataKeys", {
                "id": id,
                "keys": keys,
                "since": options.since,
                "include_deleted": options.include_deleted
            }, onSuccess, onError);
        };
        Serverville.prototype.getAllDataKeys = function (id, options, onSuccess, onError) {
            if (options == null)
                options = {};
            var self = this;
            this.callJsonApi("GetAllDataKeys", {
                "id": id,
                "since": options.since,
                "include_deleted": options.include_deleted
            }, onSuccess, onError);
        };
        Serverville.prototype.customApi = function (apiName, message, onSuccess, onError) {
            this.callJsonApi(apiName, message, onSuccess, onError);
        };
        return Serverville;
    })();
    sv.Serverville = Serverville;
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
            this.server.getAllDataKeys(this.id, { "include_deleted": true }, function (reply) {
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
            this.server.getAllDataKeys(this.id, { "include_deleted": true, "since": this.most_recent }, function (reply) {
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
                if (info.deleted)
                    delete info.deleted;
            }
            else {
                info = {
                    "id": this.id,
                    "key": key,
                    "value": val,
                    "data_type": data_type,
                    "created": 0,
                    "modified": 0
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