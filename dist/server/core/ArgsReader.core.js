"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const process = require("process");
const Logger_helper_1 = require("../helpers/Logger.helper");
class ArgsReader {
    static readConsoleArgs() {
        const args = process.argv.slice(2);
        //  The order of this block matters
        if (args.find(arg => arg.toLowerCase() === 'env=prod')) {
            Logger_helper_1.Logger.fileLogging = false;
        }
        if (args.find(arg => arg.toLowerCase() === 'env=dev')) {
            Logger_helper_1.Logger.logfilePath = '/Users/caiuscitiriga/Code/chatster/be/src/logs/chatster.log.txt';
        }
        if (args.find(arg => arg.toLowerCase() === 'conf=clear_log_file')) {
            Logger_helper_1.Logger.clearLogFile();
        }
    }
}
exports.ArgsReader = ArgsReader;
//# sourceMappingURL=ArgsReader.core.js.map