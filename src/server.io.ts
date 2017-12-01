import * as http from 'http';
import * as WebSocket from 'ws';
import * as io from 'socket.io';
import * as express from 'express';
import * as cors from 'cors';

import { ROOMS } from './configs/rooms.config';
import { SocketMessageTypes } from './configs/socket-message-types.config';

import { Room } from './entities/Room.entity';

import { ClientRegistrationDTO } from './dtos/ClientRegistration.dto';

import { RoomsManager } from './core/RoomsManager.core';

import { CommonUtils } from './utilities/utilities';
import { User } from './entities/User.entity';
import { JoinedRoomDTO } from './dtos/JoinedRoom.dto';
import { RoomDisconnectDTO } from './dtos/RoomDisconnect.dto';
import { setInterval } from 'timers';
import { SocketEventType } from '../../SocketEventType';

export class ChatsterServerIO {
    //  Socket and server stuff
    private app = express();
    private SockIO: SocketIO.Namespace;
    private HTTPServer: http.Server;
    private sockets: SocketIO.Socket[];

    //  Rooms stuff
    private rooms: Room[];
    private roomsManager: RoomsManager;

    public constructor(roomsManagerService: RoomsManager) {
        this.sockets = [];
        this.createServer();
        this.startServer();
    }

    private createServer() {
        this.HTTPServer = http.createServer(this.app);
        this.SockIO = io.listen(this.HTTPServer)
            .on(SocketEventType.connection, (socket: SocketIO.Socket) => {
                console.log('New socket connected');

                this.sockets.push(socket);
                socket.emit(SocketEventType.client.connected);

                socket.on(SocketEventType.client.registration, (clientData: { username: string, room: string }) => {
                    console.log(`Client ${clientData.username} has joined room ${clientData.room}`);

                    (<any>socket).username = clientData.username;
                    this.SockIO.emit(SocketEventType.client.registered, { username: clientData.username });
                });

                socket.on(SocketEventType.message.send, (data: { message: string, user: string }) => {
                    this.SockIO.emit(SocketEventType.message.newMessage, { message: data.message, from: data.user });
                });

                socket.on(SocketEventType.client.disconnect, () => {
                    console.log(`${(<any>socket).username} has disconnected`);

                    this.sockets = this.sockets.filter(s => s.id !== socket.id);

                    socket.disconnect();
                    this.SockIO.emit(SocketEventType.client.disconnect, { username: (<any>socket).username });
                });
            });
    }

    private startServer() {
        this.HTTPServer.listen(process.env.PORT || 4000, () => {
            console.log(`Server started on port ${this.HTTPServer.address().port}`);
        });
    }
}

const roomsManager = new RoomsManager();

new ChatsterServerIO(roomsManager);