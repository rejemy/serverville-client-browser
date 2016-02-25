/// <reference path="../src/serverville.d.ts" />
var resultConsole = document.getElementById("console");
function log(output) {
    var paragraph = document.createElement("p");
    paragraph.innerText = output;
    resultConsole.appendChild(paragraph);
    console.log(output);
}
var server = null;
function makeServer(url) {
    server = new sv.Serverville(url);
    server.LogMessagesToConsole = true;
    server.GlobalErrorHandler = function (err) {
        log("Got error: " + err.errorMessage);
        if (err.errorDetails)
            log(err.errorDetails);
    };
    server.init(signIn);
}
log("Starting tests over HTTP");
makeServer("http://localhost:8000");
function signIn(user, err) {
    log("Server connection initted");
    if (err) {
        log("Error initting server: " + err.errorMessage);
        return;
    }
    if (user) {
        log("Already logged in as " + user.username);
    }
    server.signIn("testuser1", null, "testuser1", setUserKey);
}
function setUserKey(reply) {
    server.setUserKey("testThing1", "boo", sv.JsonDataType.STRING, getUserKey);
}
function getUserKey(reply) {
    server.getUserKey("testThing1", done);
}
var httpTestDone = false;
function done(reply) {
    log("tests done");
    if (!httpTestDone) {
        httpTestDone = true;
        log("Starting tests over WebSockets");
        makeServer("ws://localhost:8000");
    }
}
//# sourceMappingURL=tests.js.map