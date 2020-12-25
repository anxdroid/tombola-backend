require('rootpath')();
const express = require('express');
const app = express();
const https = require("https"),
    fs = require("fs");
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('_middleware/error-handler');
var sC = require('./socketCollection');
const tombolaService = require('./tombola/tombola.service');
var WebSocketServer = require('websocket').server;
const config = require('config.json');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// ssl options
const options = {
    key: fs.readFileSync(config.keyPath),
    cert: fs.readFileSync(config.certPath)
};

// api routes
app.use('/users', require('./users/users.controller'));
app.use('/tombola', require('./tombola/tombola.controller'));

// global error handler
app.use(errorHandler);

// start server
var server = https.createServer(options, app)

// Websocket server
let wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function (request) {
    // nuova richiesta dal backlog
    //console.log(request);
    var connection = request.accept(null, request.origin);
    //console.log(request.origin, connection);
    // estraggo sessionid e userid dalla url
    var tokens = request.resource.split("/");
    var sessionId = +tokens[1];
    var userId = +tokens[2];
    // salvo la connessione
    socket = tombolaService.searchConnection(sessionId, userId)
    if (socket == null) {
        console.log("New websocket connection", connection.remoteAddresses+" (userId: "+userId+", sessionId: "+sessionId+")")
        sC.socketCollection.push({
            sessionId: sessionId,
            userId: userId,
            connection: connection,
        });
    }else{
        console.log("Resumed websocket connection", connection.remoteAddresses+" (userId: "+userId+", sessionId: "+sessionId+")")
        socket.connection = connection;
    }

    //console.log("Session ID: "+sessionId+" User ID: "+userId);
    tombolaService.sendToClients(sessionId, 0, 0, "startup", sessionId);

    // handler per nuovo messaggio
    connection.on('message', function (message) {
        // Metodo eseguito alla ricezione di un messaggio
        if (message.type === 'utf8') {
            //console.log(message);
            message = JSON.parse(message.utf8Data);
            //console.log(message);
            tombolaService.sendToClients(sessionId, message.userId, 0, message.command, message.payload);
        }
    });
    // handler per chiusura connessione
    connection.on('close', function (connection) {
        // Metodo eseguito alla chiusura della connessione
        console.log("Closed websocket connection", )
    });
});

server.listen(4443);