"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const io = require("socket.io");
const express = require("express");
require("rxjs/add/operator/filter");
const SocketEventType_1 = require("./x-shared/events/SocketEventType");
const rooms_config_1 = require("./configs/rooms.config");
const RoomsManger_core_1 = require("./core/RoomsManger.core");
const Logger_helper_1 = require("./helpers/Logger.helper");
const ArgsReader_core_1 = require("./core/ArgsReader.core");
class ChatsterServerIO {
    constructor(roomsManager) {
        //  Socket and server stuff
        this.app = express();
        ArgsReader_core_1.ArgsReader.readConsoleArgs();
        this.sockets = [];
        this.namespaces = [];
        this.roomsManager = roomsManager;
        //  Setup the socket before using it for the namespaces
        this.createServer();
        this.startSocketHost();
        this.createNamespacesRooms();
        this.runNamespacesListeners();
        //  Start the listener on the HOME "room"
        this.namespaces[0].on(SocketEventType_1.SocketEventType.connection, (socket) => {
            Logger_helper_1.Logger.info('A client connected to the home namespace.');
            socket.emit(SocketEventType_1.SocketEventType.client.connected);
            socket.on(SocketEventType_1.SocketEventType.room.requestList, () => {
                const DTO = this.roomsManager.prepareRoomsListDTO();
                socket.emit(SocketEventType_1.SocketEventType.room.responseList, DTO);
            });
            socket.on(SocketEventType_1.SocketEventType.disconnect, (socket) => {
                Logger_helper_1.Logger.info('A client has disconnected from the home namespace');
            });
        });
    }
    start() {
        this.HTTPServer.listen(process.env.PORT || 4000, () => {
            Logger_helper_1.Logger.info(`Server started on port ${this.HTTPServer.address().port}`);
        });
    }
    createServer() {
        this.HTTPServer = http.createServer(this.app);
    }
    startSocketHost() {
        this.SockIO = io.listen(this.HTTPServer);
    }
    createNamespacesRooms() {
        this.roomsManager
            .rooms
            .forEach(room => {
            this.namespaces.push(this.SockIO.of(room.id));
        });
    }
    runNamespacesListeners() {
        this.namespaces
            .forEach((nsp, idx) => {
            if (idx === 0) {
                return;
            }
            nsp.on(SocketEventType_1.SocketEventType.connection, (socket) => {
                socket.emit(SocketEventType_1.SocketEventType.client.connected);
                socket.on(SocketEventType_1.SocketEventType.client.registration, (data) => {
                    this.serveRoomData(socket, nsp, data.username);
                });
                //  On user disconnect from room
                socket.on(SocketEventType_1.SocketEventType.disconnect, () => {
                    const room = this.roomsManager.getRoomByUserSocketId(socket.id);
                    Logger_helper_1.Logger.info(`${room.users.find(usr => usr.socket.id === socket.id).username} has disconnected from ${room.name}`);
                    this.roomsManager.removeUserFromRoom(room.id, socket.id);
                    this.notifyHomeSocketUsersOfRoomsChange();
                    this.notifyRoomSocketUsersOfRoomsChange(room);
                });
            });
        });
    }
    serveRoomData(socket, namespace, username) {
        Logger_helper_1.Logger.info(`${username} connected to room: ${namespace.name.replace(' / ', '')}; Serving back room data.`);
        this.roomsManager.joinUserToRoom(namespace.name, socket, username);
        const Room = this.roomsManager.getRoomById(namespace.name.replace('/', ''));
        const DTO = this.roomsManager.prepareRoomDTO(Room);
        socket.emit(SocketEventType_1.SocketEventType.room.roomData, DTO);
        this.notifyHomeSocketUsersOfRoomsChange();
        this.notifyRoomSocketUsersOfRoomsChange(Room);
    }
    notifyRoomSocketUsersOfRoomsChange(room) {
        Logger_helper_1.Logger.info(`Notifying ${room.name} users of new user join`);
        const ROOM_DTO = this.roomsManager.prepareRoomDTO(room);
        this.namespaces
            .find(nsp => nsp.name === `/${room.id}`)
            .emit(SocketEventType_1.SocketEventType.client.registered, ROOM_DTO);
    }
    notifyHomeSocketUsersOfRoomsChange() {
        const ROOMS_LIST_DTO = this.roomsManager.prepareRoomsListDTO();
        this.namespaces[0].emit(SocketEventType_1.SocketEventType.client.connected, ROOMS_LIST_DTO);
    }
}
exports.ChatsterServerIO = ChatsterServerIO;
const CHATSTER = new ChatsterServerIO(new RoomsManger_core_1.RoomsManager(rooms_config_1.ROOMS));
CHATSTER.start();
//# sourceMappingURL=server.io.js.map