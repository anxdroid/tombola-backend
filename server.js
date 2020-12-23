require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('_middleware/error-handler');
var sC = require('./socketCollection');
const tombolaService = require('./tombola/tombola.service');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// api routes
app.use('/users', require('./users/users.controller'));
app.use('/tombola', require('./tombola/tombola.controller'));

// global error handler
app.use(errorHandler);

// start server
const port = process.env.NODE_ENV === 'production' ? (process.env.PORT || 80) : 4000;
app.listen(port, () => console.log('Server listening on port ' + port));

// Websocket server
var WebSocketServer = require('websocket').server;
var http = require('http');
var server = http.createServer(function (request, response) {
    // Qui possiamo processare la richiesta HTTP
    // Dal momento che ci interessano solo le WebSocket, non dobbiamo implementare nulla
});
server.listen(1337, function () { });
// Creazione del server
let wsServer = new WebSocketServer({
    httpServer: server
});


wsServer.on('request', function (request) {
    // nuova richiesta dal backlog
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