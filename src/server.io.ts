import * as http from 'http';
import * as WebSocket from 'ws';
import * as io from 'socket.io';
import * as express from 'express';
import * as cors from 'cors';

import 'rxjs/add/operator/filter';

import { RoomDTO } from './x-shared/dtos/Room.dto';
import { RoomsListDTO } from './x-shared/dtos/RoomsList.dto';

import { Room } from './x-shared/entities/Room.entity';

import { SocketEventType } from './x-shared/events/SocketEventType';

import { ROOMS } from './configs/rooms.config';
import { RoomsManager } from './core/RoomsManger.core';
import { SocketUserDTO } from './x-shared/dtos/SocketUser.dto';
import { SocketUser } from './x-shared/entities/SocketUser.entity';
import { Logger } from './helpers/Logger.helper';

export class ChatsterServerIO {
    //  Socket and server stuff
    private app = express();
    private serverStarted: boolean;
    private SockIO: SocketIO.Server;
    private HTTPServer: http.Server;
    private sockets: SocketIO.Socket[];

    //  Rooms stuff
    private roomsManager: RoomsManager;
    private namespaces: SocketIO.Namespace[];
    private rooms: Room[];

    constructor(roomsManager: RoomsManager) {
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

        this.SockIO.on(SocketEventType.connection, (socket: SocketIO.Socket) => {
            Logger.info('A client connected to the main socket.');

            this.SockIO.emit(SocketEventType.client.connected);
            this.listenForRoomsRequest(socket);

            socket.once(SocketEventType.disconnect, (socket: SocketIO.Socket) => {
                Logger.info('A client has disconnected from the main socket');
            });
        });
    }

    public start() {
        this.HTTPServer.listen(process.env.PORT || 4000, () => {
            Logger.info(`Server started on port ${this.HTTPServer.address().port}`);
        });
    }

    private readConsoleArgs() {
        const args = process.argv.slice(2);

        //  The order of this block matters
        if (args.find(arg => arg.toLowerCase() === 'env=prod')) {
            Logger.fileLogging = false;
        }
        if (args.find(arg => arg.toLowerCase() === 'env=dev')) {
            Logger.logfilePath = '/Users/caiuscitiriga/Code/chatster/be/src/logs/chatster.log.txt';
        }
        if (args.find(arg => arg.toLowerCase() === 'conf=clear_log_file')) {
            Logger.clearLogFile();
        }

    }

    private createServer() {
        this.HTTPServer = http.createServer(this.app);
    }

    private startSocketHost() {
        this.SockIO = io.listen(this.HTTPServer);
    }

    private listenForRoomsRequest(socket: SocketIO.Socket) {
        socket.once(SocketEventType.room.requestList, () => {
            const DTO = this.prepareRoomsListDTO();
            this.SockIO.emit(SocketEventType.room.responseList, DTO);
        });
    }

    private prepareRoomsListDTO(): RoomsListDTO {
        const roomsList: RoomsListDTO = new RoomsListDTO();
        roomsList.rooms = [];

        this.rooms.forEach(r => {
            const room = new RoomDTO();
            room.id = r.id;
            room.name = r.name;
            room.description = r.description;

            room.users = [];
            if (!!r.users && r.users.length) {
                r.users.forEach(usr => {
                    const userDTO = new SocketUserDTO();
                    userDTO.socketId = usr.socket.id;
                    userDTO.username = usr.username;
                    room.users.push(userDTO);
                });
            }

            roomsList.rooms.push(room);
        });

        return roomsList;
    }

    private createNamespacesRooms() {
        this.reInitializeNamespacesIfNeeded();
        this.rooms.forEach(room => {
            this.namespaces.push(this.SockIO.of(room.id));
        });
    }

    private reInitializeNamespacesIfNeeded() {
        if (this.namespaces.length) {
            //  perform a delete for each namespace, just to be sure.
            this.namespaces.forEach((ns, idx) => delete this.namespaces[idx]);
            //  then re-initialize the array
            this.namespaces = [];
        }
    }

    private runNamespacesListeners() {
        this.namespaces.forEach(room => {
            room.on(SocketEventType.client.connected, () => {
                Logger.info(`Client connected to room: ${room.name.replace(' / ', '')}`);
            });
        });
    }
}

const CHATSTER = new ChatsterServerIO(new RoomsManager(ROOMS));
CHATSTER.start();