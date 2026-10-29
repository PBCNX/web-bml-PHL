"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const logLevel = {
    error: 3,
    warn: 2,
    info: 1,
    log: 0,
    debug: -1,
};
class Logger {
    prefix;
    error = console.error.bind(console);
    warn = console.warn.bind(console);
    info = console.info.bind(console);
    log = console.log.bind(console);
    debug = console.debug.bind(console);
    constructor(prefix, level) {
        const l = logLevel[level ?? "log"] ?? logLevel.log;
        this.prefix = `${prefix}`;
        if (l > logLevel.debug) {
            this.debug = () => { };
        }
        if (l > logLevel.log) {
            this.log = () => { };
        }
        if (l > logLevel.info) {
            this.info = () => { };
        }
        if (l > logLevel.warn) {
            this.warn = () => { };
        }
        if (l > logLevel.error) {
            this.error = () => { };
        }
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map