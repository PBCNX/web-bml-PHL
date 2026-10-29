import { EPG } from "../contracts";
import type { BrowserAPI } from "../browser";
import type { Content } from "../content";
import type { Resources } from "../resource";

export interface Interpreter {
    reset(): void;
    // trueが返った場合launchDocumentなどで実行が終了した
    addScript(script: string, src?: string): Promise<boolean>;
    // trueが返った場合launchDocumentなどで実行が終了した
    runEventHandler(funcName: string): Promise<boolean>;
    resetStack(): void;
    get isExecuting(): boolean;
    setupEnvironment(browserAPI: BrowserAPI, resources: Resources, content: Content, epg: EPG): void;
}
