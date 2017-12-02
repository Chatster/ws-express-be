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
import { ArgsReader } from './core/ArgsReader.core';

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

    constructor(roomsManager: RoomsManager) {
        ArgsReader.readConsoleArgs();

        this.sockets = [];
        this.namespaces = [];
        this.roomsManager = roomsManager;

        //  Setup the socket before using it for the namespaces
        this.createServer();
        this.startSocketHost();

        this.createNamespacesRooms();
        this.runNamespacesListeners();

        //  Start the listener on the HOME "room"
        this.namespaces[0].on(SocketEventType.connection, (socket: SocketIO.Socket) => {
            Logger.info('A client connected to the home namespace.');

            socket.emit(SocketEventType.client.connected);

            socket.on(SocketEventType.room.requestList, () => {
                const DTO = this.roomsManager.prepareRoomsListDTO();
                socket.emit(SocketEventType.room.responseList, DTO);
            });

            socket.on(SocketEventType.disconnect, (socket: SocketIO.Socket) => {
                Logger.info('A client has disconnected from the home namespace');
            });
        });
    }

    public start() {
        this.HTTPServer.listen(process.env.PORT || 4000, () => {
            Logger.info(`Server started on port ${this.HTTPServer.address().port}`);
        });
    }

    private createServer() {
        this.HTTPServer = http.createServer(this.app);
    }

    private startSocketHost() {
        this.SockIO = io.listen(this.HTTPServer);
    }

    private createNamespacesRooms() {
        this.reInitializeNamespacesIfNeeded();
        this.roomsManager
            .rooms
            .forEach(room => this.namespaces.push(this.SockIO.of(room.id)));

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
        this.namespaces
            .splice(1) // don't listen on the home room
            .forEach(nsp => {
                nsp.on(SocketEventType.connection, (socket: SocketIO.Socket) => {
                    this.serveRoomData(socket, nsp);

                    //  On user disconnect from room
                    socket.on(SocketEventType.disconnect, () => {
                        const room = this.roomsManager.getRoomByUserSocketId(socket.id);
                        this.roomsManager.removeUserFromRoom(room.id, socket.id);

                        this.notifyHomeSocketUsersOfRoomsChange();

                        Logger.info(`A client has disconnected from ${nsp.name}`);
                    });
                });

            });
    }

    private serveRoomData(socket: SocketIO.Socket, namespace: SocketIO.Namespace) {
        Logger.info(`Client connected to room: ${namespace.name.replace(' / ', '')}; Serving back room data.`);
        socket.emit(SocketEventType.client.connected);

        this.roomsManager.joinUserToRoom(namespace.name, socket, 'bot-user');
        const Room = this.roomsManager.getRoomById(namespace.name.replace('/', ''));
        const DTO = this.roomsManager.prepareRoomDTO(Room);

        socket.emit(SocketEventType.room.roomData, DTO);
        this.notifyHomeSocketUsersOfRoomsChange();
    }

    private notifyHomeSocketUsersOfRoomsChange() {
        const ROOMS_LIST_DTO = this.roomsManager.prepareRoomsListDTO();
        this.namespaces[0].emit(SocketEventType.room.responseList, ROOMS_LIST_DTO);
    }
}

const CHATSTER = new ChatsterServerIO(new RoomsManager(ROOMS));
CHATSTER.start();