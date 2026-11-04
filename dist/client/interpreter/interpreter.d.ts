import { EPG } from "../contracts";
import type { BrowserAPI } from "../browser";
import type { Content } from "../content";
import type { Resources } from "../resource";
export interface Interpreter {
    reset(): void;
    addScript(script: string, src?: string): Promise<boolean>;
    runEventHandler(funcName: string): Promise<boolean>;
    resetStack(): void;
    get isExecuting(): boolean;
    setupEnvironment(browserAPI: BrowserAPI, resources: Resources, content: Content, epg: EPG): void;
}
//# sourceMappingURL=interpreter.d.ts.map