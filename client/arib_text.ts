import { decodeEUCJP } from "./euc_jp";
import { decodeShiftJIS } from "./shift_jis";
import { jisToUnicodeMap } from "./jis_to_unicode_map";
import { Profile } from "./resource";
import { type TextDecodeFunction } from "./text";

/**
 * P7 — the ARIB text designation rule, and the Philippine lenient reading of it.
 *
 * ARIB STD-B24 text is an 8-bit code with four graphic sets. The defaults for the text this engine
 * reads (BML `.btb` tables, bevent private data) are the SI defaults — G0 = Kanji, G1 = Alphanumeric,
 * GL locked to G0 — so *by default GL bytes are JIS X 0208 pairs, and ASCII needs an explicit
 * switch*: `0E` (LS1) locks GL to G1, `1B 28 4A` designates G0 ← Alphanumeric, `1B 28 42`
 * designates G0 ← Kanji. Until this patch the engine had no designation handling at all: it passed
 * `.btb` strings through the profile's plain decoder, so a designation control survived as U+000E in
 * the page's string and a designated kanji field read as ASCII.
 *
 * Three things are measured, not assumed (TVTest\docs\arib-text-shift.md §2, §3.5, §6):
 *
 *   1. conformant text switches first — TV5's banner is `0E` + "Test Broadcast";
 *   2. GMA's `.btb` text does not — "Kapuso" goes out as bare `4B 61 70 75 73 6F`, with no
 *      designation anywhere in the field;
 *   3. a designation is the guard that keeps Japanese text intact: Japanese captions and SI text
 *      are saturated with `1B 29 4A`, `1B 6E`, `0E`, `0F`, and their kanji is written in GL under
 *      those designations.
 *
 * So the rule, evaluated on each field's own bytes:
 *
 *   a field that carries a character-set switch   -> honour it (designation state machine);
 *   no switch, and an 8-bit byte (GR / UTF-8)     -> the profile's decoder, unchanged — except in
 *                                                    `auto` mode, where a field that is valid
 *                                                    non-ASCII UTF-8 is UTF-8, because that is what
 *                                                    the Philippine standard says text is;
 *   no switch, all 7-bit, and it looks like text  -> Alphanumeric, the lenient reading, in `auto`
 *                                                    mode only;
 *   anything else                                 -> the profile's decoder, i.e. as before.
 *
 * `auto` is the default because this engine is the Philippine one (`PBCNX/web-bml-PHL`); a host that
 * needs upstream's strict reading can pass `textCoding: "arib"`, which leaves every undesignated
 * field on the profile's decoder and only adds designation handling.
 *
 * The residual false positive is real and is why the lenient reading is a policy rather than an
 * unconditional rule: a pure-kanji GL field with no designation anywhere (`日本` as `46 7C 4B 5C`)
 * reads as `F|K\`. That is accepted here — TVTest-PHL accepts it too — and it is bounded by the two
 * conditions below, the unlikely-symbol list in particular.
 */
export type TextCoding = "auto" | "arib";

const ESC = 0x1b;
const LS0 = 0x0f;
const LS1 = 0x0e;
/** Single shifts (SS2/SS3). A field carrying one is designated, and this decoder does not read G2/G3. */
const SINGLE_SHIFT_2 = 0x19;
const SINGLE_SHIFT_3 = 0x1d;

/** The symbols JIS X 0208 pairs hit constantly and readable text almost never does. */
const UNLIKELY_SYMBOLS = new Set([0x7c, 0x5c, 0x7b, 0x7d, 0x5b, 0x5d, 0x7e, 0x5e]);

function hasHighByte(input: Uint8Array): boolean {
    for (let i = 0; i < input.length; i++) {
        if (input[i] >= 0x80) {
            return true;
        }
    }
    return false;
}

/**
 * Does the field carry a character-set switch? Escapes, LS0/LS1 and the single shifts count; the
 * display controls a caption body is full of (CSI, COL, SSZ, APS, CS) do not, which is the
 * distinction that matters — "no control at all" would never fire for a caption.
 */
function hasDesignation(input: Uint8Array): boolean {
    for (let i = 0; i < input.length; i++) {
        const byte = input[i];
        if (byte === ESC || byte === LS0 || byte === LS1 || byte === SINGLE_SHIFT_2 || byte === SINGLE_SHIFT_3) {
            return true;
        }
    }
    return false;
}

/**
 * The lenient reading's third condition: GL bytes that look like text. 75% printable ASCII, and none
 * of the symbols kanji pairs hit constantly. CR/LF/TAB are controls and count against the ratio; a
 * field of text with a few line breaks stays well above it.
 */
function looksLikeText(input: Uint8Array): boolean {
    if (input.length === 0) {
        return false;
    }
    let printable = 0;
    for (let i = 0; i < input.length; i++) {
        const byte = input[i];
        if (UNLIKELY_SYMBOLS.has(byte)) {
            return false;
        }
        if (byte >= 0x20 && byte <= 0x7e) {
            printable++;
        }
    }
    return printable / input.length >= 0.75;
}

const strictUTF8Decoder = new TextDecoder("utf-8", { fatal: true });

/**
 * A field that is valid UTF-8 *and* contains a non-ASCII character is UTF-8 — the Philippine
 * standard's coding for text (Annex 8, Table A8-1-1: UTF-8, no BOM, C1 as 0xC280–0xC29F). A single
 * invalid sequence means it is not UTF-8, and the caller falls back rather than sprinkling U+FFFD.
 */
function tryDecodeUTF8(input: Uint8Array): string | null {
    if (!hasHighByte(input)) {
        return null;
    }
    try {
        return strictUTF8Decoder.decode(input);
    } catch {
        return null;
    }
}

function decodeASCII(input: Uint8Array): string {
    let text = "";
    for (let i = 0; i < input.length; i++) {
        text += String.fromCharCode(input[i]);
    }
    return text;
}

/**
 * Decode a field that carries designations: G0/G1 ← Alphanumeric or Kanji (`ESC ( J`, `ESC ( B`,
 * `ESC ) J`, `ESC ) B`), and LS0/LS1. The two sets this engine has tables for are alphanumeric and
 * JIS X 0208; a field that designates or shifts into anything else is handed back to the caller as
 * undecodable, so it takes the profile's decoder and behaves exactly as before.
 *
 * Alphanumeric is emitted half-width. ARIB's own set is the full-width one, and TVTest renders a
 * conformant Japanese `0E` + "TBS1" as `ＴＢＳ１`, but web-bml has always drawn those bytes
 * half-width (with the control character in the string); keeping them half-width means this patch
 * changes no glyph on a conformant page, only the stray control that should never have been there.
 */
function decodeDesignated(input: Uint8Array): string | null {
    let g0 = "kanji";
    let g1 = "alnum";
    // GL is locked to G0 by default (ARIB STD-B24's SI defaults), and a designation of the set it is
    // locked to changes what GL reads without a shift — `1B 28 4A` alone makes GL alphanumeric.
    let gl = 0;
    let text = "";
    for (let i = 0; i < input.length; i++) {
        const byte = input[i];
        if (byte === ESC) {
            const intermediate = input[i + 1];
            const final = input[i + 2];
            if (final == null) {
                return null;
            }
            if (intermediate === 0x28) {
                if (final === 0x4a) {
                    g0 = "alnum";
                } else if (final === 0x42) {
                    g0 = "kanji";
                } else {
                    return null;
                }
            } else if (intermediate === 0x29) {
                if (final === 0x4a) {
                    g1 = "alnum";
                } else if (final === 0x42) {
                    g1 = "kanji";
                } else {
                    return null;
                }
            } else {
                // G2/G3 designation, LS2/LS3, LS1R/LS2R/LS3R: sets this decoder does not have.
                return null;
            }
            i += 2;
            continue;
        }
        if (byte === LS1) {
            gl = 1;
            continue;
        }
        if (byte === LS0) {
            gl = 0;
            continue;
        }
        if (byte === SINGLE_SHIFT_2 || byte === SINGLE_SHIFT_3 || byte >= 0x80) {
            // G2/G3 single shift, or an 8-bit byte in a designated field: not this decoder's job.
            return null;
        }
        if ((gl === 0 ? g0 : g1) === "alnum") {
            text += String.fromCharCode(byte);
            continue;
        }
        // GL kanji: JIS X 0208 pairs, ku/ten = byte - 0x20, indexed exactly as the EUC-JP decoder.
        // Both bytes must be GL (0x21–0x7E). A control byte here is not a lead — a `.btb` segment
        // that begins with a length prefix or a record header must fall back, not turn "(074) 304-…"
        // into kanji (measured: 0F 20 28 30… is LS0-shaped but is a 15-byte length).
        const trail = input[i + 1];
        if (byte < 0x21 || byte > 0x7e || trail == null || trail < 0x21 || trail > 0x7e) {
            return null;
        }
        const ku = byte - 0x20;
        const ten = trail - 0x20;
        const uni = jisToUnicodeMap[(ku - 1) * 94 + (ten - 1)];
        if (typeof uni === "number") {
            text += uni >= 0 ? String.fromCharCode(uni) : "\ufffd";
        } else if (uni != null) {
            for (const u of uni) {
                text += String.fromCharCode(u);
            }
        } else {
            text += "\ufffd";
        }
        i++;
    }
    return text;
}

/**
 * The profile's decoder, chosen once so the two call sites (this file and the caller's fallback)
 * cannot drift.
 */
export function getARIBTextFallback(profile: Profile | undefined): TextDecodeFunction {
    return profile === Profile.TrProfileC ? decodeShiftJIS : decodeEUCJP;
}

/**
 * Decode one ARIB text field. `fallback` is the decoder the caller would have used before this
 * patch; it is used for every field the rules above do not claim, so conformant and non-text fields
 * behave exactly as they did.
 */
export function decodeARIBText(input: Uint8Array, fallback: TextDecodeFunction, textCoding: TextCoding = "auto"): string {
    if (input.length === 0) {
        return "";
    }
    if (hasDesignation(input)) {
        return decodeDesignated(input) ?? fallback(input);
    }
    if (hasHighByte(input)) {
        if (textCoding === "auto") {
            const utf8 = tryDecodeUTF8(input);
            if (utf8 != null) {
                return utf8;
            }
        }
        return fallback(input);
    }
    if (textCoding === "auto" && looksLikeText(input)) {
        return decodeASCII(input);
    }
    return fallback(input);
}
