import { Context } from "../../es2";
import { Content } from "../content";
import { Resources } from "../resource";
import { BrowserAPI } from "../browser";
import { EPG } from "../bml_browser";
import { type Logger } from "../util/logger";
export declare function defineBuiltinBinding(context: Context, resources: Resources): void;
export declare function defineBrowserBinding(context: Context, resources: Resources, browserAPI: BrowserAPI, content: Content, epg: EPG, logger: Logger): void;
export declare function defineBinaryTableBinding(context: Context, resources: Resources, logger: Logger): void;
//# sourceMappingURL=es2_binding.d.ts.map