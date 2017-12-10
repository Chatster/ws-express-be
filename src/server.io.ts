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
import { ClientRegistrationDTO } from './x-shared/dtos/ClientRegistration.dto';
import { ChatRequestDTO } from './x-shared/dtos/ChatRequest.dto';
import { ChatRequestResponseDTO } from './x-shared/dtos/ChatRequestResponse.dto';
import { MessageSendDTO } from './x-shared/dtos/MessageSend.dto';

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
        this.roomsManager
            .rooms
            .forEach(room => {
                this.namespaces.push(this.SockIO.of(room.id));
            });
    }

    private runNamespacesListeners() {
        this.namespaces
            .forEach((nsp, idx) => {
                if (idx === 0) {
                    return;
                }
                nsp.on(SocketEventType.connection, (socket: SocketIO.Socket) => {
                    socket.emit(SocketEventType.client.connected);

                    socket.on(SocketEventType.client.registration, (data: ClientRegistrationDTO) => {
                        this.serveRoomData(socket, nsp, data.username);
                    });

                    //  When a chat request arrives, find the socketUser that is the receiver and send an event ONLY to him
                    socket.on(SocketEventType.client.chatRequest, (data: ChatRequestDTO) => {
                        Logger.info(`A chat request has arrived fromSockId: [${data.fromSockId}] to sockId: [${data.toSockId}]`);
                        const room = this.roomsManager.getRoomByUserSocketId(data.fromSockId);
                        const receiverUser = room.users.find(usr => usr.socket.id === data.toSockId);
                        receiverUser.socket.emit(SocketEventType.client.chatRequest, data);
                    });

                    //  When a chat request response arrives, find the socketUser that is the receiver and send an event ONLY to him
                    socket.on(SocketEventType.client.chatRequestResponse, (data: ChatRequestResponseDTO) => {
                        Logger.info(`A chat request response has arrived fromSockId: [${data.fromSockId}] to sockId: [${data.toSockId}] with status: ${data.accepted ? 'ACCEPTED' : 'DENIED'}`);
                        const room = this.roomsManager.getRoomByUserSocketId(data.fromSockId);
                        const receiverUser = room.users.find(usr => usr.socket.id === data.fromSockId);
                        receiverUser.socket.emit(SocketEventType.client.chatRequestResponse, data);
                    });

                    //  When a new message from the client socket needs to be delivered to another socket
                    socket.on(SocketEventType.message.send, (data: MessageSendDTO) => {
                        const room = this.roomsManager.getRoomByUserSocketId(data.fromSockId);
                        const receiverUser = room.users.find(usr => usr.socket.id === data.toSockId);
                        receiverUser.socket.emit(SocketEventType.message.newMessage, data);
                        Logger.info(`A new message from ${data.fromUsername} to ${data.toUsername} has been dispatched`);
                    });

                    //  On user disconnect from room
                    socket.on(SocketEventType.disconnect, () => {
                        const room = this.roomsManager.getRoomByUserSocketId(socket.id);
                        Logger.info(`${room.users.find(usr => usr.socket.id === socket.id).username} has disconnected from ${room.name}`);
                        this.roomsManager.removeUserFromRoom(room.id, socket.id);

                        this.notifyHomeSocketUsersOfRoomsChange();
                        this.notifyRoomSocketUsersOfRoomsChange(room);
                    });
                });

            });
    }

    private serveRoomData(socket: SocketIO.Socket, namespace: SocketIO.Namespace, username) {
        Logger.info(`${username} connected to room: ${namespace.name.replace(' / ', '')}; Serving back room data.`);

        this.roomsManager.joinUserToRoom(namespace.name, socket, username);
        const Room = this.roomsManager.getRoomById(namespace.name.replace('/', ''));
        const DTO = this.roomsManager.prepareRoomDTO(Room);

        socket.emit(SocketEventType.room.roomData, DTO);

        this.notifyHomeSocketUsersOfRoomsChange();
        this.notifyRoomSocketUsersOfRoomsChange(Room);
    }

    private notifyRoomSocketUsersOfRoomsChange(room: Room) {
        Logger.info(`Notifying ${room.name} users of new user join`);
        const ROOM_DTO = this.roomsManager.prepareRoomDTO(room);

        this.namespaces
            .find(nsp => nsp.name === `/${room.id}`)
            .emit(SocketEventType.client.registered, ROOM_DTO);
    }

    private notifyHomeSocketUsersOfRoomsChange() {
        const ROOMS_LIST_DTO = this.roomsManager.prepareRoomsListDTO();
        this.namespaces[0].emit(SocketEventType.client.connected, ROOMS_LIST_DTO);
    }
}

const CHATSTER = new ChatsterServerIO(new RoomsManager(ROOMS));
CHATSTER.start();