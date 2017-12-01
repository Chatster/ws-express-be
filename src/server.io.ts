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

export class ChatsterServerIO {
    //  Socket and server stuff
    private app = express();
    private SockIO: SocketIO.Namespace;
    private HTTPServer: http.Server;
    private activeSockets: SocketIO.Socket[];

    //  Rooms stuff
    private rooms: Room[];
    private roomsManager: RoomsManager;

    public constructor(roomsManagerService: RoomsManager) {
        this.activeSockets = [];
        this.roomsManager = roomsManagerService;
        this.rooms = ROOMS;
        this.rooms.forEach((r: Room) => r.id = CommonUtils.generateId());

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

    private createServer() {
        this.HTTPServer = http.createServer(this.app);
        this.SockIO = io.listen(this.HTTPServer)
            .on('connection', socket => {
                console.log('New socket connected');
                // this.activeSockets.push(socket);

                socket
                    .once(SocketMessageTypes.ROOMS_REQUEST, () => {
                        console.log('The socket is requesting rooms');
                        console.log('Serving rooms...');
                        this.SockIO.emit(SocketMessageTypes.ROOMS_RESPONSE, { rooms: this.rooms });
                    })
                    .once(SocketMessageTypes.CLIENT_REGISTRATION, (data: ClientRegistrationDTO) => {
                        console.log('Requested client registration (user/room)');
                        console.log('Room ID: %s', data.roomId);
                        console.log('Client ID: %s', data.userId);
                        console.log('User nick: %s', data.userNick);
                        console.log('Registering user into room...');

                        const user = new User();
                        user.id = data.userId;
                        user.nick = data.userNick;
                        // just to be able to kill the conn in case of disconnect
                        user.socket = socket;
                        // this will be used to remove the user from the room in case of disconnect event
                        (<any>socket).roomId = data.roomId;

                        this.roomsManager.upsertUserInRoom(data.roomId, user);
                        const joinedRoom = this.roomsManager.getRoom(data.roomId);

                        if (joinedRoom && joinedRoom.id && joinedRoom.description && joinedRoom.name) {
                            const joinedRoomDTO = new JoinedRoomDTO();
                            joinedRoomDTO.id = joinedRoom.id;
                            joinedRoomDTO.name = joinedRoom.name;
                            joinedRoomDTO.description = joinedRoom.description;

                            this.SockIO.emit(SocketMessageTypes.CLIENT_REGISTRATION, joinedRoomDTO);
                        }
                    })
                    .once(SocketMessageTypes.EXIT_ROOM, (data: RoomDisconnectDTO) => {
                        console.log('The user is requesting to exit the room: %s', data.userId);
                        console.log('Removing user from room...');
                        this.roomsManager.deleteUserFromRoom(data.userId, data.roomId);
                        this.SockIO.emit(SocketMessageTypes.EXIT_ROOM);
                    })
                    .once('disconnect', () => {
                        console.log('Socket disconnected');
                        //  this will force the removal by socket id from the given room
                        this.roomsManager.deleteUserFromRoom(null, (<any>socket).roomId, socket);
                        socket.disconnect();
                    });

                this.SockIO.emit(SocketMessageTypes.CONNECTED_CLIENT);
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