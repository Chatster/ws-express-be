"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const CLK = require("chalk");
const moment = require("moment");
const SeverityTypes_enum_1 = require("../enums/SeverityTypes.enum");
class Logger {
    static set logfilePath(val) {
        this.logFilePath = val;
    }
    static set fileLogging(val) {
        this.useFileLogger = val;
    }
    static set ConsoleLogging(val) {
        this.useConsoleLogger = val;
    }
    static info(msg) {
        if (this.useConsoleLogger) {
            console.log(this._chalk.cyan(`INFO: ${msg}`));
        }
        if (this.useFileLogger) {
            this.log(msg, SeverityTypes_enum_1.SeverityType.Info);
        }
    }
    static warn(msg) {
        if (this.useConsoleLogger) {
            console.log(this._chalk.yellow(`WARN: ${msg}`));
        }
        if (this.useFileLogger) {
            this.log(msg, SeverityTypes_enum_1.SeverityType.Warn);
        }
    }
    static error(msg) {
        if (this.useConsoleLogger) {
            console.log(this._chalk.red(`ERROR: ${msg}`));
        }
        if (this.useFileLogger) {
            this.log(msg, SeverityTypes_enum_1.SeverityType.Error);
        }
    }
    static log(msg, severity) {
        let severityMessage = '';
        if (severity === SeverityTypes_enum_1.SeverityType.Info) {
            severityMessage = 'INFO: ';
        }
        if (severity === SeverityTypes_enum_1.SeverityType.Warn) {
            severityMessage = 'WARN: ';
        }
        if (severity === SeverityTypes_enum_1.SeverityType.Error) {
            severityMessage = 'ERROR: ';
        }
        const fullMessageLog = `[${moment().format('DD/MM/YY, h:mm:ss a')}] ${severityMessage}${msg}\n`;
        fs.appendFile(this.logFilePath, fullMessageLog, err => {
            if (err) {
                console.log(this.warn('There was an error writing on the log file.'));
                console.log(this._chalk.red(err.message));
                return;
            }
        });
    }
}
Logger._chalk = CLK.default;
Logger.logFilePath = '';
Logger.useFileLogger = true;
Logger.useConsoleLogger = true;
exports.Logger = Logger;
//# sourceMappingURL=Logger.helper.js.map