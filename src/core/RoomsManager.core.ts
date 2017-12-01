import { ROOMS } from '../configs/rooms.config';

import { Room } from '../entities/Room.entity';
import { User } from '../entities/User.entity';

export class RoomsManager {
    private rooms: Room[];

    public constructor() {
        this.rooms = ROOMS;
    }

    public getRoom(id: string): Room | null {
        const room = this.rooms.find(room => room.id === id);
        if (room) {
            return room;
        }

        return null;
    }

    public upsertUserInRoom(roomId: string, user: User) {
        const room = this.rooms.find(r => r.id === roomId);
        //  If the room was found and the user is NOT in the room
        if (room && !room.users.find(userInRoom => userInRoom.id === user.id)) {
            room.users.push(user);
        } else {
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

    public deleteUserFromRoom(userId: string | null, roomId: string, socket?: SocketIO.Socket) {
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

    private deleteUserBySocketId(socketId: string, roomId: string) {
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

    private debugRooms() {
        this.rooms.forEach(r => {
            console.log('Room: %s', r.name);
            console.log('Users: %s', r.users.length);
            console.log('---------------------------');
        });
    }
}