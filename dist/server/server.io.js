"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const io = require("socket.io");
const express = require("express");
const rooms_config_1 = require("./configs/rooms.config");
const socket_message_types_config_1 = require("./configs/socket-message-types.config");
const RoomsManager_core_1 = require("./core/RoomsManager.core");
const utilities_1 = require("./utilities/utilities");
const User_entity_1 = require("./entities/User.entity");
const JoinedRoom_dto_1 = require("./dtos/JoinedRoom.dto");
class ChatsterServerIO {
    constructor(roomsManagerService) {
        //  Socket and server stuff
        this.app = express();
        this.activeSockets = [];
        this.roomsManager = roomsManagerService;
        this.rooms = rooms_config_1.ROOMS;
        this.rooms.forEach((r) => r.id = utilities_1.CommonUtils.generateId());
        this.createServer();
        this.startServer();
        // setInterval(() => {
        //     console.log('Checking for zombie sockets...');
        //     this.activeSockets.forEach((socket, idx) => {
        //         if (socket.disconnected) {
        //             console.log('Found a zombie socket...');
        //             socket.disconnect();
        //             this.roomsManager.deleteUserFromRoom(null, (<any>socket).roomId, socket);
        //             delete this.activeSockets[idx];
        //         }
        //     });
        // }, 10000);
    }
    createServer() {
        this.HTTPServer = http.createServer(this.app);
        this.SockIO = io.listen(this.HTTPServer)
            .on('connection', socket => {
            console.log('New socket connected');
            // this.activeSockets.push(socket);
            socket
                .once(socket_message_types_config_1.SocketMessageTypes.ROOMS_REQUEST, () => {
                console.log('The socket is requesting rooms');
                console.log('Serving rooms...');
                this.SockIO.emit(socket_message_types_config_1.SocketMessageTypes.ROOMS_RESPONSE, { rooms: this.rooms });
            })
                .once(socket_message_types_config_1.SocketMessageTypes.CLIENT_REGISTRATION, (data) => {
                console.log('Requested client registration (user/room)');
                console.log('Room ID: %s', data.roomId);
                console.log('Client ID: %s', data.userId);
                console.log('User nick: %s', data.userNick);
                console.log('Registering user into room...');
                const user = new User_entity_1.User();
                user.id = data.userId;
                user.nick = data.userNick;
                // just to be able to kill the conn in case of disconnect
                user.socket = socket;
                // this will be used to remove the user from the room in case of disconnect event
                socket.roomId = data.roomId;
                this.roomsManager.upsertUserInRoom(data.roomId, user);
                const joinedRoom = this.roomsManager.getRoom(data.roomId);
                if (joinedRoom && joinedRoom.id && joinedRoom.description && joinedRoom.name) {
                    const joinedRoomDTO = new JoinedRoom_dto_1.JoinedRoomDTO();
                    joinedRoomDTO.id = joinedRoom.id;
                    joinedRoomDTO.name = joinedRoom.name;
                    joinedRoomDTO.description = joinedRoom.description;
                    this.SockIO.emit(socket_message_types_config_1.SocketMessageTypes.CLIENT_REGISTRATION, joinedRoomDTO);
                }
            })
                .once(socket_message_types_config_1.SocketMessageTypes.EXIT_ROOM, (data) => {
                console.log('The user is requesting to exit the room: %s', data.userId);
                console.log('Removing user from room...');
                this.roomsManager.deleteUserFromRoom(data.userId, data.roomId);
                this.SockIO.emit(socket_message_types_config_1.SocketMessageTypes.EXIT_ROOM);
            })
                .once('disconnect', () => {
                console.log('Socket disconnected');
                //  this will force the removal by socket id from the given room
                this.roomsManager.deleteUserFromRoom(null, socket.roomId, socket);
                socket.disconnect();
            });
            this.SockIO.emit(socket_message_types_config_1.SocketMessageTypes.CONNECTED_CLIENT);
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