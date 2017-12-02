import * as process from 'process';

import { Logger } from '../helpers/Logger.helper';

export class ArgsReader {
    public static readConsoleArgs() {
        const args = process.argv.slice(2);

        //  The order of this block matters
        if (args.find(arg => arg.toLowerCase() === 'env=prod')) {
            Logger.fileLogging = false;
        }
        if (args.find(arg => arg.toLowerCase() === 'env=dev')) {
            Logger.logfilePath = '/Users/caiuscitiriga/Code/chatster/be/src/logs/chatster.log.txt';
        }
        if (args.find(arg => arg.toLowerCase() === 'conf=clear_log_file')) {
            Logger.clearLogFile();
        }
    }
}