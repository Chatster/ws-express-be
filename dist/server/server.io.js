"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const io = require("socket.io");
const express = require("express");
const rooms_config_1 = require("./configs/rooms.config");
const socket_message_types_config_1 = require("./configs/socket-message-types.config");
const utilities_1 = require("./utilities/utilities");
class ChatsterServerIO {
    constructor() {
        this.app = express();
        this.rooms = rooms_config_1.ROOMS;
        this.rooms.forEach((r) => r.id = utilities_1.CommonUtils.generateId());
        this.createServer();
        this.startServer();
    }
    createServer() {
        this.HTTPServer = http.createServer(this.app);
        this.SockIOManager = io.listen(this.HTTPServer)
            .on('connection', socket => {
            console.log('Client connected');
            this.listenForRoomsRequest(socket);
            this.listenForClientRegistration(socket);
            socket.on('disconnect', data => {
                console.log(data);
            });
        });
    }
    listenForRoomsRequest(socket) {
        console.log(this.rooms);
        socket.on(socket_message_types_config_1.SocketMessageTypes.ROOMS_REQUEST, () => {
            socket.emit(socket_message_types_config_1.SocketMessageTypes.ROOMS_RESPONSE, { rooms: this.rooms });
        });
    }
    listenForClientRegistration(socket) {
        socket.emit(socket_message_types_config_1.SocketMessageTypes.CONNECTED_CLIENT);
        socket.on(socket_message_types_config_1.SocketMessageTypes.CLIENT_REGISTRATION, (data) => {
            console.log(data);
        });
    }
    startServer() {
        this.HTTPServer.listen(process.env.PORT || 4000, () => {
            console.log(`Server started on port ${this.HTTPServer.address().port}`);
        });
    }
}
exports.ChatsterServerIO = ChatsterServerIO;
new ChatsterServerIO();
//# sourceMappingURL=server.io.js.map