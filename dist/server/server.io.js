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
        this.reInitializeNamespacesIfNeeded();
        this.roomsManager
            .rooms
            .forEach(room => this.namespaces.push(this.SockIO.of(room.id)));
    }
    reInitializeNamespacesIfNeeded() {
        if (this.namespaces.length) {
            //  perform a delete for each namespace, just to be sure.
            this.namespaces.forEach((ns, idx) => delete this.namespaces[idx]);
            //  then re-initialize the array
            this.namespaces = [];
        }
    }
    runNamespacesListeners() {
        this.namespaces
            .splice(1) // don't listen on the home room
            .forEach(nsp => {
            nsp.on(SocketEventType_1.SocketEventType.connection, (socket) => {
                this.serveRoomData(socket, nsp);
                //  On user disconnect from room
                socket.on(SocketEventType_1.SocketEventType.disconnect, () => {
                    const room = this.roomsManager.getRoomByUserSocketId(socket.id);
                    this.roomsManager.removeUserFromRoom(room.id, socket.id);
                    this.notifyHomeSocketUsersOfRoomsChange();
                    Logger_helper_1.Logger.info(`A client has disconnected from ${nsp.name}`);
                });
            });
        });
    }
    serveRoomData(socket, namespace) {
        Logger_helper_1.Logger.info(`Client connected to room: ${namespace.name.replace(' / ', '')}; Serving back room data.`);
        socket.emit(SocketEventType_1.SocketEventType.client.connected);
        this.roomsManager.joinUserToRoom(namespace.name, socket, 'bot-user');
        const Room = this.roomsManager.getRoomById(namespace.name.replace('/', ''));
        const DTO = this.roomsManager.prepareRoomDTO(Room);
        socket.emit(SocketEventType_1.SocketEventType.room.roomData, DTO);
        this.notifyHomeSocketUsersOfRoomsChange();
    }
    notifyHomeSocketUsersOfRoomsChange() {
        const ROOMS_LIST_DTO = this.roomsManager.prepareRoomsListDTO();
        this.namespaces[0].emit(SocketEventType_1.SocketEventType.room.responseList, ROOMS_LIST_DTO);
    }
}
exports.ChatsterServerIO = ChatsterServerIO;
const CHATSTER = new ChatsterServerIO(new RoomsManger_core_1.RoomsManager(rooms_config_1.ROOMS));
CHATSTER.start();
//# sourceMappingURL=server.io.js.map