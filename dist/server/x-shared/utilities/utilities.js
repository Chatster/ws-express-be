"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CommonUtils {
    static generateId() {
        const mask = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
        return mask.replace(/[x]/g, c => Math.floor((new Date().getTime() + Math.random() * 16) % 16).toString(16));
    }
}
exports.CommonUtils = CommonUtils;
//# sourceMappingURL=utilities.js.map