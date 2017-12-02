import { SocketUser } from "./SocketUser.entity";

export class Room {
    public id: string;
    public name: string;
    public users: SocketUser[];
    public description: string;
}
