import { type Logger } from "../util/logger";
/** The 256-entry base a CLUT starts from; entries a stream does not set stay opaque black. */
export declare function defaultCLUTTable(): number[][];
/**
 * Decodes a CLUT section. A CLUT this function cannot read answers `defaultCLUT` — the same array a
 * *missing* CLUT gives, so the two fallbacks have one shape — and logs why: it used to log for one
 * unreadable case, say "unexpected" for another and throw for a third, while its callers only fell
 * back to the default for a *missing* file.
 */
export declare function readCLUT(clut: Uint8Array<ArrayBuffer>, logger: Logger): number[][];
//# sourceMappingURL=clut.d.ts.map