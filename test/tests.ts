/// <reference path="../src/serverville.d.ts" />

var resultConsole:HTMLDivElement = <HTMLDivElement>document.getElementById("console");

function log(output:string):void
{
    var paragraph:HTMLParagraphElement = document.createElement("p");
    paragraph.innerText = output;
    resultConsole.appendChild(paragraph);
    console.log(output);
}

var server:sv.Serverville = null;

function makeServer(url:string):void
{
    server = new sv.Serverville(url);
    server.LogMessagesToConsole = true;

    server.GlobalErrorHandler = function(err:sv.ErrorReply):void
    {
        log("Got error: "+err.errorMessage);
        if(err.errorDetails)
            log(err.errorDetails);
    };
    
    server.init(signIn);
}

log("Starting tests over HTTP");

makeServer("http://localhost:8000");

function signIn(user:sv.SignInReply, err:sv.ErrorReply):void
{
    log("Server connection initted")
    
    if(err)
    {
        log("Error initting server: "+err.errorMessage);
        return;
    }
    
    if(user)
    {
        log("Already logged in as "+user.username);
    }
    
    server.signIn("testuser1", null, "testuser1", setUserKey);
}

function setUserKey(reply:sv.SignInReply):void
{
    server.setUserKey("testThing1", "boo", sv.JsonDataType.STRING, getUserKey);
}

function getUserKey(reply:sv.SetDataReply):void
{
    server.getUserKey("testThing1", done);
}

var httpTestDone:boolean = false;

function done(reply:sv.DataItemReply):void
{
    log("tests done");
    
    if(!httpTestDone)
    {
        httpTestDone = true;
        log("Starting tests over WebSockets");
        makeServer("ws://localhost:8000");
    }
}
