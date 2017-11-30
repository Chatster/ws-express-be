import * as http from 'http';
import * as WebSocket from 'ws';
import * as io from 'socket.io';
import * as express from 'express';
import * as cors from 'cors';

import { Room } from './entities/Room.entity';
import { ROOMS } from './configs/rooms.config';
import { SocketMessageTypes } from './configs/socket-message-types.config';
import { CommonUtils } from './utilities/utilities';

export class ChatsterServerIO {
    private rooms: Room[];
    private app = express();
    private HTTPServer: http.Server;
    private SockIOManager: SocketIO.Namespace;

    public constructor() {
        this.rooms = ROOMS;
        this.rooms.forEach((r: Room) => r.id = CommonUtils.generateId());

        this.createServer();
        this.startServer();
    }

    private createServer() {
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

    private listenForRoomsRequest(socket: SocketIO.Socket) {
        console.log(this.rooms);
        socket.on(SocketMessageTypes.ROOMS_REQUEST, () => {
            socket.emit(SocketMessageTypes.ROOMS_RESPONSE, { rooms: this.rooms });
        });
    }

    private listenForClientRegistration(socket: SocketIO.Socket) {
        socket.emit(SocketMessageTypes.CONNECTED_CLIENT);
        socket.on(SocketMessageTypes.CLIENT_REGISTRATION, (data: { userId: string }) => {
            console.log(data);
        });
    }

    private startServer() {
        this.HTTPServer.listen(process.env.PORT || 4000, () => {
            console.log(`Server started on port ${this.HTTPServer.address().port}`);
        });
    }
}

new ChatsterServerIO();