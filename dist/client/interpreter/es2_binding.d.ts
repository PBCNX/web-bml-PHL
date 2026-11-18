import { Context } from "../../es2";
import { Content } from "../content";
import { Resources } from "../resource";
import { Profile } from "../profile";
import { BrowserAPI } from "../browser";
import { EPG } from "../contracts";
import { type Logger } from "../util/logger";
/**
 * The slice of stream state the builtin (non-DOM) bindings actually read.
 * The caller supplies these through getters, so the profile is picked up once the PMT arrives and
 * the clock keeps tracking the stream instead of freezing at binding time.
 */
export interface BuiltinBindingEnvironment {
    readonly profile: Profile | undefined;
    readonly currentTimeUnixMillis: number | null;
}
export declare function defineBuiltinBinding(context: Context, env: BuiltinBindingEnvironment): void;
export declare function defineBrowserBinding(context: Context, resources: Resources, browserAPI: BrowserAPI, content: Content, epg: EPG, logger: Logger): void;
export declare function defineBinaryTableBinding(context: Context, resources: Resources, logger: Logger): void;
//# sourceMappingURL=es2_binding.d.ts.map