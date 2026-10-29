import { EPG } from "../bml_browser";
import { BrowserAPI } from "../browser";
import { Content } from "../content";
import { Resources } from "../resource";
export interface Interpreter {
    reset(): void;
    addScript(script: string, src?: string): Promise<boolean>;
    runEventHandler(funcName: string): Promise<boolean>;
    destroyStack(): void;
    resetStack(): void;
    get isExecuting(): boolean;
    setupEnvironment(browserAPI: BrowserAPI, resources: Resources, content: Content, epg: EPG): void;
}
//# sourceMappingURL=interpreter.d.ts.map