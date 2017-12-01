"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const io = require("socket.io");
const express = require("express");
const RoomsManager_core_1 = require("./core/RoomsManager.core");
class ChatsterServerIO {
    constructor(roomsManagerService) {
        //  Socket and server stuff
        this.app = express();
        this.sockets = [];
        this.createServer();
        this.startServer();
    }
    createServer() {
        this.HTTPServer = http.createServer(this.app);
        this.SockIO = io.listen(this.HTTPServer)
            .on('connection', socket => {
            console.log('New socket connected');
            this.sockets.push(socket);
            socket.emit('client.connected');
            socket.on('client.registration', (clientData) => {
                socket.username = clientData.username;
                console.log(`Client ${clientData.username} has joined room ${clientData.room}`);
                this.SockIO.emit('client.registered', { username: clientData.username });
            });
            socket.on('message.send', (data) => {
                this.SockIO.emit('message.new', { message: data.message, from: data.user });
            });
            socket.on('disconnect', () => {
                this.sockets = this.sockets.filter(s => s.id !== socket.id);
                console.log(`${socket.username} has disconnected`);
                socket.disconnect();
                this.SockIO.emit('client.disconnected', { username: socket.username });
            });
        });
    }
    startServer() {
        this.HTTPServer.listen(process.env.PORT || 4000, () => {
            console.log(`Server started on port ${this.HTTPServer.address().port}`);
        });
    }
}
exports.ChatsterServerIO = ChatsterServerIO;
const roomsManager = new RoomsManager_core_1.RoomsManager();
new ChatsterServerIO(roomsManager);
//# sourceMappingURL=server.io.js.map