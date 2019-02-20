var bodyParser = require('body-parser')
var WebSocketServer = require('websocket').server;
var http = require('http');
var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

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
        if (data.type === 'Login') {
            broadcast({type:"USER_CONNECTED",payload:data.user})
        }
        if (data.type === 'Logout') {
            broadcast({type:"USER_DISCONNECTED",payload:data.user})
        }
        if (data.type === 'New Game') {
            broadcast({type:"NEW_GAME",payload:data.game})
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