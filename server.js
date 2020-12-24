require('rootpath')();
const express = require('express');
const app = express();
//var http = require('http');

const https = require("https"),
    fs = require("fs");
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('_middleware/error-handler');
var sC = require('./socketCollection');
const tombolaService = require('./tombola/tombola.service');
var WebSocketServer = require('websocket').server;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// ssl options
const options = {
    key: fs.readFileSync("./privkey.pem"),
    cert: fs.readFileSync("./fullchain.pem")
};

// api routes
app.use('/users', require('./users/users.controller'));
app.use('/tombola', require('./tombola/tombola.controller'));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
//app.listen(port, () => console.log('Server listening on port ' + port));
var server = https.createServer(options, app)

// Websocket server

/*
var server = http.createServer(function (request, response) {
    // Qui possiamo processare la richiesta HTTP
    // Dal momento che ci interessano solo le WebSocket, non dobbiamo implementare nulla
});
server.listen(1337, function () { });
*/
// Creazione del server
let wsServer = new WebSocketServer({
    httpServer: server
});

wsServer.on('request', function (request) {
    // nuova richiesta dal backlog
    console.log(request);
    var connection = request.accept(null, request.origin);
    // estraggo sessionid e userid dalla url
    var tokens = request.resource.split("/");
    var sessionId = +tokens[1];
    var userId = +tokens[2];
    // salvo la connessione
    sC.socketCollection.push({
        sessionId: sessionId,
        userId: userId,
        connection: connection,
    });

    //console.log("Session ID: "+sessionId+" User ID: "+userId);

    messaggio = {
        sessionId: sessionId,
        userId: 0,
        command: "startup",
        payload: sessionId,
        date: new Date()
    };
    tombolaService.notifyClients(sessionId, 0, JSON.stringify(messaggio))

    // handler per nuovo messaggio
    connection.on('message', function (message) {
        // Metodo eseguito alla ricezione di un messaggio
        //console.log(message);
        if (message.type === 'utf8') {
            message = JSON.parse(message.utf8Data);
            messaggio = {
                sessionId: message.sessionId,
                userId: message.userId,
                command: message.command,
                payload: message.payload,
                date: new Date()
            };
            tombolaService.notifyClients(sessionId, message.userId, JSON.stringify(messaggio))
        }
    });
    // handler per chiusura connessione
    connection.on('close', function (connection) {
        // Metodo eseguito alla chiusura della connessione
        console.log("Closed websocket session")
    });
});

server.listen(4443);