import { Context, InterpreterObject, Program } from "../../es2";
import { Interpreter } from "./interpreter";
import { Content } from "../content";
import { Resources } from "../resource";
import { BrowserAPI } from "../browser";
import { EPG } from "../contracts";
import { type Logger } from "../util/logger";
export declare class ES2Interpreter implements Interpreter {
    context: Context;
    prototypes: Map<any, InterpreterObject>;
    map: WeakMap<any, InterpreterObject>;
    reset(): void;
    private _isExecuting;
    private browserAPI;
    private resources;
    private content;
    private epg;
    private readonly logger;
    private readonly browserLogger;
    constructor(logger: Logger, browserLogger: Logger);
    setupEnvironment(browserAPI: BrowserAPI, resources: Resources, content: Content, epg: EPG): void;
    addScript(script: string, src?: string): Promise<boolean>;
    /** P1: どの<script>を実行中か (エラー記録の名前付けにだけ使う) */
    private runningScript?;
    private exeNum;
    runScript(program: Program): Promise<boolean>;
    get isExecuting(): boolean;
    runEventHandler(funcName: string): Promise<boolean>;
    resetStack(): void;
}
//# sourceMappingURL=es2_interpreter.d.ts.map