require('rootpath')();
const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('_middleware/error-handler');
var sC = require('./socketCollection');

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

//
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
// Gestione degli eventi
wsServer.on('request', function (request) {
    //console.log("New request", request.origin);
    var connection = request.accept(null, request.origin);
    sC.socketCollection.push({
        id: 0,
        connection: connection,
    });
    //console.log(sC.socketCollection);

    connection.sendUTF("Avvio della sessione !")

    connection.on('message', function (message) {
        // Metodo eseguito alla ricezione di un messaggio
        console.log(message);
        if (message.type === 'utf8') {
            // Se il messaggio è una stringa, possiamo leggerlo come segue:
            console.log('Il messaggio ricevuto è: ' + message.utf8Data);
        }
    });
    connection.on('close', function (connection) {
        // Metodo eseguito alla chiusura della connessione
    });
});