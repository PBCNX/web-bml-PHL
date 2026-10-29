"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ES2Interpreter = void 0;
const es2_1 = require("../../es2");
const es2_dom_binding_1 = require("./es2_dom_binding");
const es2_binding_1 = require("./es2_binding");
const LAUNCH_DOCUMENT_CALLED = { type: "launchDocumentCalled" };
class ES2Interpreter {
    context = null; // lazyinit
    prototypes = new Map();
    map = new WeakMap();
    reset() {
        const context = (0, es2_1.createGlobalContext)();
        this.context = context;
        this.prototypes = new Map();
        this.map = new WeakMap();
        const prototypes = this.prototypes;
        const map = this.map;
        // DOMのバインディングを定義
        (0, es2_dom_binding_1.define)(this.context, prototypes, map);
        for (const p of prototypes.values()) {
            p.internalProperties.class = "hostobject";
        }
        context.realm.globalObject.properties.set("document", {
            readOnly: false,
            dontEnum: false,
            dontDelete: true,
            value: (0, es2_dom_binding_1.wrap)(prototypes, map, this.content.bmlDocument),
        });
        (0, es2_binding_1.defineBuiltinBinding)(context, this.resources);
        (0, es2_binding_1.defineBrowserBinding)(context, this.resources, this.browserAPI, this.content, this.epg, this.browserLogger);
        (0, es2_binding_1.defineBinaryTableBinding)(context, this.resources, this.browserLogger);
        this.resetStack();
    }
    _isExecuting;
    // lazyinit
    browserAPI = null;
    resources = null;
    content = null;
    epg = null;
    logger;
    browserLogger;
    constructor(logger, browserLogger) {
        this._isExecuting = false;
        this.logger = logger;
        this.browserLogger = browserLogger;
    }
    setupEnvironment(browserAPI, resources, content, epg) {
        this.browserAPI = browserAPI;
        this._isExecuting = false;
        this.resources = resources;
        this.content = content;
        this.epg = epg;
        this.reset();
    }
    addScript(script, src) {
        let program;
        try {
            program = (0, es2_1.parse)(script, { name: src ?? "anonymous", source: script });
        }
        catch (e) {
            this.logger.error(`${this.logger.prefix}failed to parse script`, src, e);
            // P1: 構文エラーはページを止めるが、コンソールにしか出なかった
            this.resources?.diagnostics.scriptError("parse", src, e);
            return Promise.resolve(false);
        }
        this.runningScript = src;
        return this.runScript(program);
    }
    /** P1: どの<script>を実行中か (エラー記録の名前付けにだけ使う) */
    runningScript;
    exeNum = 0;
    async runScript(program) {
        if (this.isExecuting) {
            throw new Error("this.isExecuting");
        }
        const prevContext = this.content.context;
        const context = this.context;
        let exit = false;
        const exeNum = this.exeNum++;
        this.logger.debug(`${this.logger.prefix}runScript()`, exeNum, prevContext, this.content.context);
        try {
            this._isExecuting = true;
            while (true) {
                this.logger.debug(`${this.logger.prefix}RUN SCRIPT`, exeNum, prevContext, this.content.context);
                try {
                    let executionStartTime = performance.now();
                    // 50ms実行し続けると一旦中断
                    const shouldInterrupt = () => {
                        return performance.now() - executionStartTime > 50;
                    };
                    const iter = (0, es2_1.run)(program, { ...context, shouldInterrupt });
                    let lastResult = undefined;
                    while (true) {
                        executionStartTime = performance.now();
                        const { value, done } = iter.next(lastResult);
                        lastResult = undefined;
                        if (typeof value === "object" && value != null && "type" in value && value.type === "launchDocumentCalled") {
                            this.logger.debug(`${this.logger.prefix}browser.launchDocument called.`);
                            exit = true;
                            break;
                        }
                        else if (typeof value === "object" && value != null && "type" in value && value.type === "interruption") {
                            // 中断したら50ms待って再開
                            this.logger.warn(`${this.logger.prefix}script execution timeout`);
                            await new Promise((resolve) => {
                                setTimeout(() => {
                                    resolve(true);
                                }, 50);
                            });
                        }
                        else if (value instanceof Promise) {
                            lastResult = await value;
                        }
                        if (done) {
                            break;
                        }
                    }
                    this.logger.debug(`${this.logger.prefix}RETURN RUN SCRIPT`, exeNum, prevContext, this.content.context);
                }
                catch (e) {
                    this.logger.error(`${this.logger.prefix}unhandled error`, exeNum, prevContext, this.content.context, e);
                    // P1: 実行時例外。どのスクリプトが投げたかは名前で分かる範囲で残す
                    this.resources?.diagnostics.scriptError("run", this.runningScript, e);
                }
                if (this.content.context !== prevContext) {
                    this.logger.error(`${this.logger.prefix}context switched`, this.content.context, prevContext);
                    exit = true;
                }
                break;
            }
            if (!exit && this.content.context !== prevContext) {
                this.logger.error(`${this.logger.prefix}context switched`, this.content.context, prevContext);
                exit = true;
            }
        }
        finally {
            this.logger.debug(`${this.logger.prefix}leave runScript()`, exeNum, exit, prevContext, this.content.context);
            if (exit) {
                return true;
            }
            else {
                this._isExecuting = false;
            }
        }
        return false;
    }
    get isExecuting() {
        return this._isExecuting;
    }
    async runEventHandler(funcName) {
        return await this.addScript(`${funcName}();`, `eventHandler:${funcName}`);
    }
    destroyStack() {
    }
    resetStack() {
        this._isExecuting = false;
    }
}
exports.ES2Interpreter = ES2Interpreter;
//# sourceMappingURL=es2_interpreter.js.map