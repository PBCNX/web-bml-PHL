declare const logLevel: {
    readonly error: 3;
    readonly warn: 2;
    readonly info: 1;
    readonly log: 0;
    readonly debug: -1;
};
export type LogLevel = keyof typeof logLevel;
export declare class Logger {
    prefix: string;
    error: (...data: any[]) => void;
    warn: (...data: any[]) => void;
    info: (...data: any[]) => void;
    log: (...data: any[]) => void;
    debug: (...data: any[]) => void;
    constructor(prefix: string, level?: LogLevel);
}
export {};
//# sourceMappingURL=logger.d.ts.map