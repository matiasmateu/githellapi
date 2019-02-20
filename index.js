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
    x : 100,
    y : 50
}

let player2 = {
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
    console.log((new Date()) + ' Connection accepted!.');
    connection.on('message', function (message) {
        var data = JSON.parse(message.utf8Data)
        console.log("Received from a client:")
        console.log(data)
        if (data.type === 'Login') {
            console.log("Sending User Connected")
            console.log(data.data)
            broadcast({type:"USER_CONNECTED",payload:data.data})
        }
        if (data.type === 'Logout') {
            console.log("Sending User Disconnected")
            console.log(data.data)
            broadcast({type:"USER_DISCONNECTED",payload:data.data})
        }
        if (data.type === 'NEW_GAME_REQUEST') {
            console.log("Sending Game")
            console.log(game)
            broadcast({type:"NEW_GAME",payload:game})
            console.log("Sending Player1")
            console.log(player1)
            broadcast({type:"UPDATE_PLAYER1",payload:player1})
            console.log("Sending Player2")
            console.log(player2)
            broadcast({type:"UPDATE_PLAYER2",payload:player2})
        }

        if (data.type === 'UPDATE_PLAYER1') {
            player1.x = data.data.x
            player1.y = data.data.y
            console.log("Sending Player1")
            console.log(player1)
            broadcast({type:"UPDATE_PLAYER1",payload:player1})
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