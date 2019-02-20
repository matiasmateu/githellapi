var bodyParser = require('body-parser')
var WebSocketServer = require('websocket').server;
var http = require('http');
var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

// TEMPORAL DATA
let game = {
    isRunning :false,
    gravity:0.3,
    velocity:1
}

let player1 = {
    available:true,
    client_id:0,
    x : 100,
    y : 50
}

let player2 = {
    available:true,
    client_id:0,
    x : 300,
    y : 50
}

server.listen(8080, function () {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
})

// list of currently connected clients (users)
var clients = [ ];

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

function broadcast(data){
    for (var i=0; i < clients.length; i++) {
        clients[i].send(JSON.stringify(data))
       
    }
}

function assignPlayer(){
        if (player1.available){
            player1.id = 1
            return player1
        }else{
            if (player2.available){
                return player2
            }else{
                return null
            }   
        }
}

wsServer.on('request', function (request) {
    if (!originIsAllowed(request.origin)) {
        // Make sure we only accept requests from an allowed origin
        request.reject();
        console.log(' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    var connection = request.accept('echo-protocol', request.origin);
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    console.log((new Date()) + ' Connection accepted!. ID:');
  
    connection.on('message', function (message) {
        var data = JSON.parse(message.utf8Data)

        // PRINT DATA RECEIVED FROM THE CLIENT FOR TESTING
        /*
        console.log("Received from a client:")
        console.log(data)
        */

        // LOGIN LOGIC
        if (data.type === 'Login') {
            console.log("Request received: USER LOGIN")    
            reply = {type:"USER_CONNECTED",payload:data.data}     
            console.log("Reply to the request:"+JSON.stringify(reply))
            broadcast(reply)
        }

        // LOGOUT LOGIC
        if (data.type === 'Logout') {
            console.log("Request received: USER LOGOUT")
            reply = {type:"USER_DISCONNECTED",payload:data.data}
            console.log("Reply to the request:"+JSON.stringify(reply))
            broadcast(reply)
        }

        // NEW GAME LOGIC
        if (data.type === 'NEW_GAME_REQUEST') {
            console.log("Request received: NEW GAME")
            reply1 = {type:"NEW_GAME",payload:game}
            reply2 = {type:"UPDATE_PLAYER1",payload:player1}
            reply3 = {type:"UPDATE_PLAYER2",payload:player2}
            console.log("Reply to the request:"+JSON.stringify(reply1)+JSON.stringify(reply2)+JSON.stringify(reply3))
            broadcast(reply1)
            broadcast(reply2)
            broadcast(reply3)
        }

        // UPDATE PLAYER 1
        if (data.type === 'UPDATE_PLAYER1') {
            console.log('Request received: UPDATE PLAYER 1')
            player1.x = data.data.x
            player1.y = data.data.y
            reply = {type:"UPDATE_PLAYER1",payload:player1}
            console.log("Reply to the request:"+JSON.stringify(reply))
            broadcast(reply)
        }

        /*
        else if (message.type === 'binary') {
            console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
            connection.sendBytes(message.binaryData);
        }*/
    });
    connection.on('close', function (reasonCode, description) {
        console.log(' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});