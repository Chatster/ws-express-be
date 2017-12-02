"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SocketClientEvents {
    constructor() {
        this.connected = 'client.connected';
        this.registered = 'client.registered';
        this.registration = 'client.registration';
        this.disconnect = 'client.disconnect';
        this.disconnected = 'client.disconnected';
    }
}
class SocketMessageEvents {
    constructor() {
        this.send = 'message.send';
        this.newMessage = 'message.new';
    }
}
class SocketRoomEvents {
    constructor() {
        this.requestList = 'rooms.request.list';
        this.responseList = 'rooms.response.list';
        this.roomData = 'room.data';
    }
}
class SocketEventType {
}
SocketEventType.connection = 'connection';
SocketEventType.disconnect = 'disconnect';
SocketEventType.client = new SocketClientEvents();
SocketEventType.message = new SocketMessageEvents();
SocketEventType.room = new SocketRoomEvents();
exports.SocketEventType = SocketEventType;
//# sourceMappingURL=SocketEventType.js.map