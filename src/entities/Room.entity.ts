import { User } from './User.entity';

export class Room {
    id?: string;
    name: string;
    description: string;
    users: User[];
}
