import { BehaviorSubject } from 'rxjs/BehaviorSubject'

import { ROOMS } from '../configs/rooms.config';
import { Room } from '../x-shared/entities/Room.entity';
import { Observable } from 'rxjs/Observable';


export class RoomsManager {
    private _$rooms: BehaviorSubject<Room[]>;

    constructor(ROOMS: Room[]) {
        this._$rooms = new BehaviorSubject(ROOMS);
    }

    public get $rooms(): Observable<Room[]> {
        return this._$rooms.asObservable();
    }
}