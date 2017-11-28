"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const app = express();
//initialize a simple http server
const server = http.createServer(app);
//initialize the WebSocket server instance
const wss = new WebSocket.Server({ server });
wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });
    //connection is up, let's add a simple simple event
    ws.on('message', (message) => {
        //log the received message and send it back to the client
        console.log('Recieved message from client');
        console.log(message);
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.message === 'CONNECTED_CLIENT') {
            console.log('New client connected');
            ws.clientId = parsedMessage.payload.clientId;
        }
        //  Send a message recieved confirm to the client
        ws.send('Message recieved');
        // const broadcastRegex = /^broadcast\:/;
        // if (broadcastRegex.test(message)) {
        //     message = message.replace(broadcastRegex, '');
        //     //send back the message to the other clients
        //     wss.clients
        //         .forEach(client => {
        //             if (client != ws) {
        //                 client.send(`Hello, broadcast message -> ${message}`);
        //             }
        //         });
        // } else {
        //     ws.send(`Hello, you sent -> ${message}`);
        // }
    });
    //send immediatly a feedback to the incoming connection    
    ws.send('Hi there, I am a WebSocket server');
});
setInterval(() => {
    wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
            console.log();
            return ws.terminate();
        }
        console.log('Client %s still alive', ws.clientId);
        ws.isAlive = false;
        ws.ping(null, false, true);
    });
}, 10000);
wss.on('error', (e) => {
    console.log('Error: -> %s', e.message);
});
//start our server
server.listen(process.env.PORT || 3000, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});
//# sourceMappingURL=server.js.map