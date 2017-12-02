import * as io from 'socket.io-client';

export class SocketUser {
    public socket: SocketIOClient.Socket;
    public username: string;
}