"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BehaviorSubject_1 = require("rxjs/BehaviorSubject");
class RoomsManager {
    constructor(ROOMS) {
        this._$rooms = new BehaviorSubject_1.BehaviorSubject(ROOMS);
    }
    get $rooms() {
        return this._$rooms.asObservable();
    }
}
exports.RoomsManager = RoomsManager;
//# sourceMappingURL=RoomsManger.core.js.map