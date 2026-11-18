import { decodeEUCJP, encodeEUCJP } from "./charset/euc_jp";
import { decodeShiftJIS, encodeShiftJIS } from "./charset/shift_jis";
import { Profile } from "./profile";

export type TextDecodeFunction = (input: Uint8Array) => string;
export type TextEncodeFunction = (input: string) => Uint8Array;

export function getTextDecoder(profile: Profile | undefined): TextDecodeFunction {
    if (profile === Profile.TrProfileC) {
        return decodeShiftJIS;
    } else {
        return decodeEUCJP;
    }
}

export function getTextEncoder(profile: Profile | undefined): TextEncodeFunction {
    if (profile === Profile.TrProfileC) {
        return encodeShiftJIS;
    } else {
        return encodeEUCJP;
    }
}

export function normalizeCharset(charset: string | null | undefined): string | null {
    if (charset == null) {
        return null;
    }
    const name = charset.trim().toLowerCase().replace(/_/g, "-");
    if (name === "") {
        return null;
    }
    if (name === "shift-jis" || name === "sjis" || name === "x-sjis" || name === "ms-kanji") {
        return "shift-jis";
    }
    if (name === "euc-jp" || name === "x-euc-jp" || name === "ujis") {
        return "euc-jp";
    }
    if (name === "utf-8" || name === "utf8" || name === "us-ascii" || name === "ascii") {
        return "utf-8";
    }
    return name;
}

const utf8Decoder = new TextDecoder("utf-8");

export function decodeUTF8(input: Uint8Array): string {
    return utf8Decoder.decode(input);
}

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
export function getDeclaredTextDecoder(profile: Profile | undefined, charset: string | null | undefined): TextDecodeFunction {
    const declared = normalizeCharset(charset);
    if (declared == null) {
        return getTextDecoder(profile);
    }
    // The profile's own character set takes the profile's own decoder, so a page that was already
    // decoded correctly decodes through the identical function it used before this patch.
    const nativeCharset = profile === Profile.TrProfileC ? "shift-jis" : "euc-jp";
    if (declared === nativeCharset) {
        return getTextDecoder(profile);
    }
    if (declared === "shift-jis") {
        return decodeShiftJIS;
    }
    if (declared === "euc-jp") {
        return decodeEUCJP;
    }
    if (declared === "utf-8") {
        return decodeUTF8;
    }
    return getTextDecoder(profile);
}

