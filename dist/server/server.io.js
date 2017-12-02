"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const io = require("socket.io");
const express = require("express");
require("rxjs/add/operator/filter");
const Room_dto_1 = require("./x-shared/dtos/Room.dto");
const RoomsList_dto_1 = require("./x-shared/dtos/RoomsList.dto");
const SocketEventType_1 = require("./x-shared/events/SocketEventType");
const rooms_config_1 = require("./configs/rooms.config");
const RoomsManger_core_1 = require("./core/RoomsManger.core");
const SocketUser_dto_1 = require("./x-shared/dtos/SocketUser.dto");
const Logger_helper_1 = require("./helpers/Logger.helper");
class ChatsterServerIO {
    constructor(roomsManager) {
        //  Socket and server stuff
        this.app = express();
        this.readConsoleArgs();
        this.rooms = [];
        this.sockets = [];
        this.namespaces = [];
        this.roomsManager = roomsManager;
        //  Setup the socket before using it for the namespaces
        this.createServer();
        this.startSocketHost();
        this.roomsManager.$rooms
            .filter(rooms => !!rooms)
            .subscribe(rooms => {
            this.rooms = rooms;
            this.createNamespacesRooms();
            this.runNamespacesListeners();
        });
        this.SockIO.on(SocketEventType_1.SocketEventType.connection, (socket) => {
            Logger_helper_1.Logger.info('A client connected to the main socket.');
            this.SockIO.emit(SocketEventType_1.SocketEventType.client.connected);
            this.listenForRoomsRequest(socket);
            socket.once(SocketEventType_1.SocketEventType.disconnect, (socket) => {
                Logger_helper_1.Logger.info('A client has disconnected from the main socket');
            });
        });
    }
    start() {
        this.HTTPServer.listen(process.env.PORT || 4000, () => {
            Logger_helper_1.Logger.info(`Server started on port ${this.HTTPServer.address().port}`);
        });
    }
    readConsoleArgs() {
        const args = process.argv.slice(2);
        //  The order of this block matters
        if (args.find(arg => arg.toLowerCase() === 'env=prod')) {
            Logger_helper_1.Logger.fileLogging = false;
        }
        if (args.find(arg => arg.toLowerCase() === 'env=dev')) {
            Logger_helper_1.Logger.logfilePath = '/Users/caiuscitiriga/Code/chatster/be/src/logs/chatster.log.txt';
        }
        if (args.find(arg => arg.toLowerCase() === 'conf=clear_log_file')) {
            Logger_helper_1.Logger.clearLogFile();
        }
    }
    createServer() {
        this.HTTPServer = http.createServer(this.app);
    }
    startSocketHost() {
        this.SockIO = io.listen(this.HTTPServer);
    }
    listenForRoomsRequest(socket) {
        socket.once(SocketEventType_1.SocketEventType.room.requestList, () => {
            const DTO = this.prepareRoomsListDTO();
            this.SockIO.emit(SocketEventType_1.SocketEventType.room.responseList, DTO);
        });
    }
    prepareRoomsListDTO() {
        const roomsList = new RoomsList_dto_1.RoomsListDTO();
        roomsList.rooms = [];
        this.rooms.forEach(r => {
            const room = new Room_dto_1.RoomDTO();
            room.id = r.id;
            room.name = r.name;
            room.description = r.description;
            room.users = [];
            if (!!r.users && r.users.length) {
                r.users.forEach(usr => {
                    const userDTO = new SocketUser_dto_1.SocketUserDTO();
                    userDTO.socketId = usr.socket.id;
                    userDTO.username = usr.username;
                    room.users.push(userDTO);
                });
            }
            roomsList.rooms.push(room);
        });
        return roomsList;
    }
    createNamespacesRooms() {
        this.reInitializeNamespacesIfNeeded();
        this.rooms.forEach(room => {
            this.namespaces.push(this.SockIO.of(room.id));
        });
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
        this.namespaces.forEach(room => {
            room.on(SocketEventType_1.SocketEventType.client.connected, () => {
                Logger_helper_1.Logger.info(`Client connected to room: ${room.name.replace(' / ', '')}`);
            });
        });
    }
}
exports.ChatsterServerIO = ChatsterServerIO;
const CHATSTER = new ChatsterServerIO(new RoomsManger_core_1.RoomsManager(rooms_config_1.ROOMS));
CHATSTER.start();
//# sourceMappingURL=server.io.js.map