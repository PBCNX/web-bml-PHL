declare const logLevel: {
    readonly error: 3;
    readonly warn: 2;
    readonly info: 1;
    readonly log: 0;
    readonly debug: -1;
};
export type LogLevel = keyof typeof logLevel;
type Write = (...args: any[]) => void;
export declare class Logger {
    prefix: string;
    error: Write;
    warn: Write;
    info: Write;
    log: Write;
    debug: Write;
    constructor(prefix: string, level?: LogLevel);
}
export {};
//# sourceMappingURL=logger.d.ts.map