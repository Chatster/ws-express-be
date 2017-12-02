import * as io from 'socket.io-client';

export class SocketUser {
    public socket: SocketIO.Socket;
    public username: string;
}