"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RoomsList_dto_1 = require("../x-shared/dtos/RoomsList.dto");
const Room_dto_1 = require("../x-shared/dtos/Room.dto");
const SocketUser_dto_1 = require("../x-shared/dtos/SocketUser.dto");
const SocketUser_entity_1 = require("../x-shared/entities/SocketUser.entity");
class RoomsManager {
    constructor(ROOMS) {
        this._rooms = ROOMS;
    }
    get rooms() {
        return this._rooms;
    }
    getRoomById(id) {
        return this._rooms.find(r => r.id === id);
    }
    getRoomByUserSocketId(socketId) {
        let room = null;
        this.rooms.forEach(r => {
            if (r.users.find(usr => usr.socket.id === socketId)) {
                room = r;
            }
        });
        return room;
    }
    joinUserToRoom(roomId, socket, username) {
        roomId = roomId.replace('/', '');
        if (this.rooms.find(room => room.id === roomId)) {
            const socketUser = new SocketUser_entity_1.SocketUser();
            socketUser.socket = socket;
            socketUser.username = username;
            //  Check that the array is not undefined
            if (this.rooms.find(room => room.id === roomId).users) {
                this.rooms.find(room => room.id === roomId).users.push(socketUser);
            }
            else {
                this.rooms.find(room => room.id === roomId).users = [socketUser];
            }
        }
    }
    removeUserFromRoom(roomId, userSockId) {
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
    prepareRoomDTO(room) {
        const DTO = new Room_dto_1.RoomDTO();
        DTO.id = room.id;
        DTO.name = room.name;
        DTO.description = room.description;
        DTO.users = [];
        room.users.forEach(usr => {
            const socketUserDTO = new SocketUser_dto_1.SocketUserDTO();
            socketUserDTO.socketId = usr.socket.id;
            socketUserDTO.username = usr.username;
            DTO.users.push(socketUserDTO);
        });
        return DTO;
    }
    prepareRoomsListDTO() {
        const roomsList = new RoomsList_dto_1.RoomsListDTO();
        roomsList.rooms = [];
        this._rooms
            .forEach(r => {
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
        roomsList.rooms = roomsList.rooms.filter(room => room.id !== 'home');
        return roomsList;
    }
}
exports.RoomsManager = RoomsManager;
//# sourceMappingURL=RoomsManger.core.js.map