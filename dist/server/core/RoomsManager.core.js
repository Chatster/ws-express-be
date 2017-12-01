"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rooms_config_1 = require("../configs/rooms.config");
class RoomsManager {
    constructor() {
        this.rooms = rooms_config_1.ROOMS;
    }
    getRoom(id) {
        const room = this.rooms.find(room => room.id === id);
        if (room) {
            return room;
        }
        return null;
    }
    upsertUserInRoom(roomId, user) {
        const room = this.rooms.find(r => r.id === roomId);
        //  If the room was found and the user is NOT in the room
        if (room && !room.users.find(userInRoom => userInRoom.id === user.id)) {
            room.users.push(user);
        }
        else {
            //  If the room was find and the user is already in the room
            if (room && room.users.find(userInRoom => userInRoom.id === user.id)) {
                room.users.forEach(userInRoom => {
                    if (userInRoom.id === user.id) {
                        userInRoom = user;
                    }
                });
            }
        }
        //  If the room was found, update it
        if (room) {
            this.rooms.forEach(inMemoryRoom => {
                if (inMemoryRoom.id === roomId) {
                    inMemoryRoom = room;
                }
            });
            console.log('The user was successfully added to the room');
            this.debugRooms();
        }
    }
    deleteUserFromRoom(userId, roomId, socket) {
        if (!!socket && userId === null) {
            this.deleteUserBySocketId(socket.id, roomId);
            return;
        }
        const concernedRoom = this.rooms.find(room => room.id === roomId);
        if (concernedRoom) {
            concernedRoom.users = concernedRoom.users.filter(userInRoom => userInRoom.id !== userId);
        }
        this.rooms.forEach(room => {
            if (room.id === roomId && concernedRoom) {
                room = concernedRoom;
            }
        });
        console.log('User successfully removed from room.');
        this.debugRooms();
    }
    deleteUserBySocketId(socketId, roomId) {
        const concernedRoom = this.rooms.find(room => room.id === roomId);
        if (concernedRoom) {
            concernedRoom.users = concernedRoom.users.filter(userInRoom => userInRoom.socket.id !== socketId);
        }
        this.rooms.forEach(room => {
            if (room.id === roomId && concernedRoom) {
                room = concernedRoom;
            }
        });
        console.log('User successfully removed from room by socket.');
        this.debugRooms();
    }
    debugRooms() {
        this.rooms.forEach(r => {
            console.log('Room: %s', r.name);
            console.log('Users: %s', r.users.length);
            console.log('---------------------------');
        });
    }
}
exports.RoomsManager = RoomsManager;
//# sourceMappingURL=RoomsManager.core.js.map