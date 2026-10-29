import { type Logger } from "./util/logger";
/**
 * Decodes a CLUT section. A CLUT this function cannot read answers the default table and logs why:
 * it used to log and carry on for one unreadable case (reading the wrong bytes afterwards), say
 * "unexpected" for another and throw for a third, while its callers only fell back to the default for
 * a *missing* file.
 */
export declare function readCLUT(clut: Uint8Array<ArrayBuffer>, logger: Logger): number[][];
//# sourceMappingURL=clut.d.ts.map