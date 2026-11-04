const logLevel = {
    error: 3,
    warn: 2,
    info: 1,
    log: 0,
    debug: -1,
} as const;
export type LogLevel = keyof typeof logLevel;

type Write = (...args: any[]) => void;

/** A console method that writes its channel prefix ahead of the message, like the call sites used to. */
function withPrefix(write: Write, prefix: string): Write {
    return (...args: any[]) => {
        if (typeof args[0] === "string") {
            write(prefix + args[0], ...args.slice(1));
        } else {
            write(prefix, ...args);
        }
    };
}

export class Logger
{
    public prefix: string;
    public error: Write;
    public warn: Write;
    public info: Write;
    public log: Write;
    public debug: Write;
    constructor(prefix: string, level?: LogLevel) {
        const l = logLevel[level ?? "log"] ?? logLevel.log;
        this.prefix = `${prefix}`;
        this.error = withPrefix(console.error.bind(console), this.prefix);
        this.warn = withPrefix(console.warn.bind(console), this.prefix);
        this.info = withPrefix(console.info.bind(console), this.prefix);
        this.log = withPrefix(console.log.bind(console), this.prefix);
        this.debug = withPrefix(console.debug.bind(console), this.prefix);
        if (l > logLevel.debug) {
            this.debug = () => {};
        }
        if (l > logLevel.log) {
            this.log = () => {};
        }
        if (l > logLevel.info) {
            this.info = () => {};
        }
        if (l > logLevel.warn) {
            this.warn = () => {};
        }
        if (l > logLevel.error) {
            this.error = () => {};
        }
    }
}
