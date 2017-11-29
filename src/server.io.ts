import * as express from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';
import * as io from 'socket.io';
import { ClientMessageEntity } from './entities/ClientMessage.entity';

const app = express();

//initialize a simple http server
const server = http.createServer(app);
io.listen(server).on('connection', client => {
    console.log('Socket.io started!');
    client.emit('CONNECTED_CLIENT', 'Youre connected to Socket.IO dude!');
});

//start our server
server.listen(process.env.PORT || 4000, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});