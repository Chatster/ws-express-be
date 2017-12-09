class SocketClientEvents {
    public connected = 'client.connected';

    public registered = 'client.registered';
    public registration = 'client.registration';

    public disconnect = 'client.disconnect';
    public disconnected = 'client.disconnected';

    public chatRequest = 'client.chat.request';
    public chatRequestResponse = 'client.chat-request.response';
}

class SocketMessageEvents {
    public send = 'message.send';
    public newMessage = 'message.new';
}

class SocketRoomEvents {
    public requestList = 'rooms.request.list';
    public responseList = 'rooms.response.list';

    //  Deprecated
    public roomData = 'room.data';
}

export class SocketEventType {
    public static connection = 'connection';
    public static disconnect = 'disconnect';
    public static client = new SocketClientEvents();
    public static message = new SocketMessageEvents();
    public static room = new SocketRoomEvents();
}

