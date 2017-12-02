import { SocketUserDTO } from './SocketUser.dto';

export class RoomDTO {
    id: string;
    name: string;
    users: SocketUserDTO[];
    description: string;
}
