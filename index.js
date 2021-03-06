
var bodyParser = require('body-parser')
var WebSocketServer = require('websocket').server;
var http = require('http');
var server = http.createServer(function (request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.whiteHead(404)
    response.end()
});
server.listen(8080,function(){
    console.log(new Date() + 'Server Listening on port 8080')
})

// TEMPORAL DATA
var clients = [];

let game = {
    isRunning: false,
    gravity: 0.3,
    velocity: 1
}
let player1 = {
    id: 0,
    x: 100,
    y: 50
}
let player2 = {
    id: 0,
    x: 300,
    y: 50
}
wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
})
function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}
function broadcast(data) {
    for (var i = 0; i < clients.length; i++) {
        clients[i].send(JSON.stringify(data))
    }
}
// CREATE PLATFORMS
function createPlatforms(){
    let platforms = []
    let nrOfPlatforms = 15
    let position = 10
    for (var i = 0; i < nrOfPlatforms; i++) {
      platforms[i] = new Platform(Math.random() * (1410 - 70), position)
      if (position < 680 - 20) position += ~~(680 / nrOfPlatforms)
    }
    return platforms
}
function createFlag(){
    let flag = []
    let nrOfFlags = 1
    let position = 200
    for (var i = 0; i < nrOfFlags; i++) {
      flag[i] = new Flag(Math.random() * (1410 - 70), position)
      if (position < 680 - 20) position += ~~(680 / nrOfFlags)
    }
    return flag
}
function serverLoop(){
    reply2 = { type: "CONCILIATION_PLAYER1", payload: player1 }
    reply3 = { type: "CONCILIATION_PLAYER2", payload: player2 }
    broadcast(reply2)
    broadcast(reply3)
    setTimeout(serverLoop, 1000 / 60);
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
    var index = clients.push(connection);
    console.log((new Date()) + ' Connection accepted!');
    console.log(clients.length)

    connection.on('message', function (message) {
        var data = JSON.parse(message.utf8Data)
        // LOGIN LOGIC
        if (data.type === 'Login') {
            console.log("Request received: USER LOGIN:"+data.data)
            reply = { type: "USER_CONNECTED",payload:data.data}
            console.log("Reply to the request:" + JSON.stringify(reply))
            connection.send(JSON.stringify(reply))
            broadcast({type:"CONNECTIONS_UPDATE",payload:data.data})
        }
        // LOGOUT LOGIC
        if (data.type === 'Logout') {
            console.log("Request received: USER LOGOUT")
            reply = { type: "USER_DISCONNECTED", payload: assignPlayer() }
            console.log("Reply to the request:" + JSON.stringify(reply))
            broadcast(reply)
        }
        // NEW GAME LOGIC
        if (data.type === 'NEW_GAME_REQUEST') {
            console.log("Request received: NEW GAME")
            game.isRunning = true;
            reply1 = { type: "UPDATE_GAME", payload: game }
            reply2 = { type: "UPDATE_PLAYER1", payload: player1 }
            reply3 = { type: "UPDATE_PLAYER2", payload: player2 }
            reply4 = {type:"UPDATE_PLATFORMS",payload:createPlatforms()}
            reply5 = {type:"UPDATE_FLAG",payload:createFlag()}
            console.log("Reply to the request:" + JSON.stringify(reply1) + JSON.stringify(reply2) + JSON.stringify(reply3)+ JSON.stringify(reply4) + JSON.stringify(reply5))
            broadcast(reply1)
            broadcast(reply2)
            broadcast(reply3)
            broadcast(reply4)
            broadcast(reply5)
            serverLoop()
        }

        // GAME OVER LOGIC
        if (data.type === "GAME_OVER_REQUEST") {
            console.log("Request received: GAME_OVER")

            // RESET STATS
            game = { isRunning: false, gravity: 0.3, velocity: 1 }
            reply1 = { type: "UPDATE_GAME", payload: game }
            broadcast(reply1)

            player1 = { id: 0, x: 100, y: 50 }
            player2 = { id: 0, x: 300, y: 50 }

            // PREPARE NEW DATA TO SEND
            reply1 = { type: "UPDATE_GAME", payload: game }
            p1 = { type: "USER_DISCONNECTED", payload: 'player1' }
            p2 = { type: "USER_DISCONNECTED", payload: 'player2' }
            reply2 = { type: "UPDATE_PLAYER1", payload: player1 }
            reply3 = { type: "UPDATE_PLAYER2", payload: player2 }
            

            console.log("Reply to the request: FULL RESET")
            broadcast(p1)
            broadcast(p2)
            broadcast(reply2)
            broadcast(reply3)
            
        }

        // NEW PLATFORMS RECEIVED
        if (data.type === 'NEW_PLATFORMS'){
            console.log('Request received: UPDATE PLATFORMS')
            platforms = data.data
            reply = {type:"UPDATE_PLATFORMS",payload:this.createPlatforms()}
            console.log('Reply to the request'+JSON.stringify(reply))
            broadcast(reply)
        }

        // NEW FLAG RECEIVED
        if (data.type === 'NEW_FLAG'){
            console.log('Request received: UPDATE FLAG')
            flag = data.data
            reply = {type:"UPDATE_FLAG",payload:this.createFlag()}
            console.log('Reply to the request'+JSON.stringify(reply))
            broadcast(reply)
        }

        // UPDATE PLAYER
        if (data.type === 'UPDATE_PLAYER') {
            console.log('Request received: UPDATE PLAYER')
            console.log(data.data)
            if (data.data.player === 'player1') {
                player1.x = data.data.x
                player1.y = data.data.y
                reply = { type: "UPDATE_PLAYER1", payload: player1 }
                console.log("Reply to the request:" + JSON.stringify(reply))
                broadcast(reply)
            } else {
                
                    player2.x = data.data.x
                    player2.y = data.data.y
                    reply = { type: "UPDATE_PLAYER2", payload: player2 }
                    console.log("Reply to the request:" + JSON.stringify(reply))
                    broadcast(reply)
                

            }

        }
    });
    connection.on('close', function (reasonCode, description) {
        console.log(' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

class Platform {
    constructor(x, y) {
        this.X = ~~x;
        this.Y = y;
        this.firstColor = '#FF8C00';
        // this.secondColor = '#EEEE00';
    }

    draw(ctx) {
        // ctx.fillStyle = this.firstColor;
        ctx.fillRect(this.X,this.Y,100,20);
    }
}

class Flag {
    constructor(x, y) {
        this.X = ~~x;
        this.Y = y;
        this.firstColor = '#FF8C00';
        // this.secondColor = '#EEEE00';
    }

    draw(ctx) {
        // ctx.fillStyle = this.firstColor;
        ctx.fillRect(this.X,this.Y,50,50);
    }
}
