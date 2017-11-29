"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const http = require("http");
const io = require("socket.io");
const app = express();
//initialize a simple http server
const server = http.createServer(app);
io.listen(server).on('connection', client => {
    console.log('Socket.io started!');
    client.emit('CONNECTED_CLIENT', 'Youre connected to Socket.IO dude!');
});
//start our server
server.listen(process.env.PORT || 4000, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});
//# sourceMappingURL=server.io.js.map