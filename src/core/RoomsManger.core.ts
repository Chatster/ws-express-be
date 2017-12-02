import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import { ROOMS } from '../configs/rooms.config';
import { Room } from '../x-shared/entities/Room.entity';
import { Observable } from 'rxjs/Observable';
import { RoomsListDTO } from '../x-shared/dtos/RoomsList.dto';
import { RoomDTO } from '../x-shared/dtos/Room.dto';
import { SocketUserDTO } from '../x-shared/dtos/SocketUser.dto';
import { SocketUser } from '../x-shared/entities/SocketUser.entity';


export class RoomsManager {
    private _rooms: Room[];

    constructor(ROOMS: Room[]) {
        this._rooms = ROOMS;
    }

    public get rooms(): Room[] {
        return this._rooms;
    }

    public getRoomById(id: string): Room | undefined {
        return this._rooms.find(r => r.id === id);
    }

    public getRoomByUserSocketId(socketId: string): Room | null {
        let room: Room = null;
        this.rooms.forEach(r => {
            if (r.users.find(usr => usr.socket.id === socketId)) {
                room = r;
            }
        });

        return room;
    }

    public joinUserToRoom(roomId: string, socket: SocketIO.Socket, username: string) {
        roomId = roomId.replace('/', '');

        if (this.rooms.find(room => room.id === roomId)) {
            const socketUser = new SocketUser();
            socketUser.socket = socket;
            socketUser.username = username;

            //  Check that the array is not undefined
            if (this.rooms.find(room => room.id === roomId).users) {
                this.rooms.find(room => room.id === roomId).users.push(socketUser);
            } else {
                this.rooms.find(room => room.id === roomId).users = [socketUser];
            }

        }
    }

    public removeUserFromRoom(roomId: string, userSockId: string): boolean {
        const roomInWhereTheUserIs = this.getRoomByUserSocketId(userSockId);

        if (roomInWhereTheUserIs) {
            roomInWhereTheUserIs.users = roomInWhereTheUserIs.users.filter(usr => usr.socket.id !== userSockId);
            this._rooms.forEach(r => {
                if (r.id === roomInWhereTheUserIs.id) {
                    r = roomInWhereTheUserIs;
                }
            });

            return true;
        }

        return false;
    }

    public prepareRoomDTO(room: Room): RoomDTO {
        const DTO = new RoomDTO();

        DTO.id = room.id;
        DTO.name = room.name;
        DTO.description = room.description;
        DTO.users = [];

        room.users.forEach(usr => {
            const socketUserDTO = new SocketUserDTO();
            socketUserDTO.socketId = usr.socket.id;
            socketUserDTO.username = usr.username;

            DTO.users.push(socketUserDTO);
        });

        return DTO;
    }

    public prepareRoomsListDTO(): RoomsListDTO {
        const roomsList: RoomsListDTO = new RoomsListDTO();
        roomsList.rooms = [];

        this._rooms
            .forEach(r => {
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

        roomsList.rooms = roomsList.rooms.filter(room => room.id !== 'home');
        return roomsList;
    }
}