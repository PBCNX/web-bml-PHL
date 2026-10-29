"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeARIBText = decodeARIBText;
const jis_to_unicode_map_1 = require("../charset/jis_to_unicode_map");
const ESC = 0x1b;
const LS0 = 0x0f;
const LS1 = 0x0e;
/** Single shifts (SS2/SS3). A field carrying one is designated, and this decoder does not read G2/G3. */
const SINGLE_SHIFT_2 = 0x19;
const SINGLE_SHIFT_3 = 0x1d;
/** The symbols JIS X 0208 pairs hit constantly and readable text almost never does. */
const UNLIKELY_SYMBOLS = new Set([0x7c, 0x5c, 0x7b, 0x7d, 0x5b, 0x5d, 0x7e, 0x5e]);
function hasHighByte(input) {
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
function hasDesignation(input) {
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
function looksLikeText(input) {
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
function tryDecodeUTF8(input) {
    if (!hasHighByte(input)) {
        return null;
    }
    try {
        return strictUTF8Decoder.decode(input);
    }
    catch {
        return null;
    }
}
function decodeASCII(input) {
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
function decodeDesignated(input) {
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
                }
                else if (final === 0x42) {
                    g0 = "kanji";
                }
                else {
                    return null;
                }
            }
            else if (intermediate === 0x29) {
                if (final === 0x4a) {
                    g1 = "alnum";
                }
                else if (final === 0x42) {
                    g1 = "kanji";
                }
                else {
                    return null;
                }
            }
            else {
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
        const uni = jis_to_unicode_map_1.jisToUnicodeMap[(ku - 1) * 94 + (ten - 1)];
        if (typeof uni === "number") {
            text += uni >= 0 ? String.fromCharCode(uni) : "\ufffd";
        }
        else if (uni != null) {
            for (const u of uni) {
                text += String.fromCharCode(u);
            }
        }
        else {
            text += "\ufffd";
        }
        i++;
    }
    return text;
}
/**
 * Decode one ARIB text field. `fallback` is the decoder the caller would have used before this
 * patch; it is used for every field the rules above do not claim, so conformant and non-text fields
 * behave exactly as they did.
 */
function decodeARIBText(input, fallback, textCoding = "auto") {
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
//# sourceMappingURL=arib_text.js.map