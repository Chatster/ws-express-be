import * as fs from 'fs';
import * as path from 'path';
import * as CLK from 'chalk';
import * as moment from 'moment';

import { SeverityType } from '../enums/SeverityTypes.enum';

export class Logger {
    private static _chalk = CLK.default;
    private static logFilePath = '';

    private static useFileLogger = true;
    private static useConsoleLogger = true;

    public static set logfilePath(val: string) {
        this.logFilePath = val;
    }

    public static set fileLogging(val: boolean) {
        this.useFileLogger = val;
    }

    public static set ConsoleLogging(val: boolean) {
        this.useConsoleLogger = val;
    }

    public static info(msg: string) {
        if (this.useConsoleLogger) {
            console.log(this._chalk.cyan(`INFO: ${msg}`));
        }

        if (this.useFileLogger) {
            this.log(msg, SeverityType.Info);
        }
    }

    public static warn(msg: string) {
        if (this.useConsoleLogger) {
            console.log(this._chalk.yellow(`WARN: ${msg}`));
        }

        if (this.useFileLogger) {
            this.log(msg, SeverityType.Warn);
        }
    }

    public static error(msg: string) {
        if (this.useConsoleLogger) {
            console.log(this._chalk.red(`ERROR: ${msg}`));
        }

        if (this.useFileLogger) {
            this.log(msg, SeverityType.Error);
        }
    }

    public static clearLogFile() {
        fs.writeFile(this.logFilePath, '', err => {
            if (err) {
                console.log(this.warn('There was an error clearing the log file.'));
                console.log(this._chalk.red(err.message));
                return;
            }
        });
    }

    private static log(msg: string, severity: SeverityType) {
        let severityMessage = '';

        if (severity === SeverityType.Info) {
            severityMessage = 'INFO: ';
        }
        if (severity === SeverityType.Warn) {
            severityMessage = 'WARN: ';
        }
        if (severity === SeverityType.Error) {
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