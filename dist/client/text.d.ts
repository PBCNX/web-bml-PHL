import { Profile } from "./resource";
export type TextDecodeFunction = (input: Uint8Array) => string;
export type TextEncodeFunction = (input: string) => Uint8Array;
export declare function getTextDecoder(profile: Profile | undefined): TextDecodeFunction;
export declare function getTextEncoder(profile: Profile | undefined): TextEncodeFunction;
/**
 * P6 — decode a document by the charset it declares.
 *
 * The profile decides the *default* character set (A: EUC-JP, C: Shift_JIS), and that is right for
 * the pages the standard was written around. It is not right for every page that actually goes out:
 * a utf-8 page carrying `Peñafrancia` reached the screen as `Pe?afrancia`, and the Village Island
 * demo (declared Shift_JIS, carried on an A-profile stream) drew mojibake for text that was perfect
 * on disk. Both are the same fault: the decoder was chosen from the profile and the document's own
 * declaration was never read.
 *
 * Rule, deliberately written so nothing that works today can move:
 *
 *   - no declaration, or a declaration that *is* the profile's own set → the profile's decoder,
 *     i.e. the exact function and bytes as before;
 *   - a declaration naming a set this engine has a decoder for → that decoder;
 *   - anything else → the profile's decoder.
 *
 * ASCII is identical in all of them, so an ASCII page is unaffected either way.
 */
export declare function normaliseCharset(charset: string | null | undefined): string | null;
export declare function decodeUTF8(input: Uint8Array): string;
export declare function getDeclaredTextDecoder(profile: Profile | undefined, charset: string | null | undefined): TextDecodeFunction;
//# sourceMappingURL=text.d.ts.map