"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeEUCJP = decodeEUCJP;
exports.encodeEUCJP = encodeEUCJP;
exports.stripStringEUCJP = stripStringEUCJP;
const jis_to_unicode_map_1 = require("./jis_to_unicode_map");
const unicode_to_jis_map_1 = require("./unicode_to_jis_map");
// EUC-JPからstringに変換する
function decodeEUCJP(input) {
    if (input.length === 0) {
        return "";
    }
    const replacementCharacter = "\ufffd"; // �
    let buffer = "";
    for (let i = 0; i < input.length; i++) {
        if (input[i] >= 0xa1 && input[i] <= 0xfe) {
            const ku = input[i] - 0xa0;
            i++;
            if (i >= input.length) {
                buffer += replacementCharacter;
                break;
            }
            if (input[i] < 0xa1 || input[i] > 0xfe) {
                buffer += replacementCharacter;
                if (input[i] < 0x80) {
                    i--;
                }
                continue;
            }
            const ten = input[i] - 0xa0;
            const uni = jis_to_unicode_map_1.jisToUnicodeMap[(ku - 1) * 94 + (ten - 1)];
            if (typeof uni === "number") {
                if (uni >= 0) {
                    buffer += String.fromCharCode(uni);
                }
                else {
                    buffer += replacementCharacter;
                }
            }
            else {
                for (const u of uni) {
                    buffer += String.fromCharCode(u);
                }
            }
        }
        else if (input[i] < 0x80) {
            buffer += String.fromCharCode(input[i]);
        }
        else if (input[i] === 0x8e) {
            // 半角カナカナは運用しない (STD-B24 第二分冊(2/2) 第二編 付属1 13.2.1 表13-1, TR-B14 第二分冊 3.4.1.2 表3-12)
            buffer += replacementCharacter;
            i++;
        }
        else if (input[i] === 0x8f) {
            // 3バイト文字(JIS X 0212-1990)は運用しない (STD-B24 第二分冊(2/2) 第二編 付属1 13.2.1 表13-1, TR-B14 第二分冊 3.4.1.2 表3-12)
            buffer += replacementCharacter;
            i += 2;
        }
        else {
            buffer += replacementCharacter;
        }
    }
    return buffer;
}
function encodeEUCJP(input) {
    const buf = new Uint8Array(input.length * 2);
    let off = 0;
    for (let i = 0; i < input.length; i++) {
        const c = input.charCodeAt(i);
        const a = unicode_to_jis_map_1.unicodeToJISMap[c];
        if (a == null && c < 0x80) {
            buf[off++] = c;
            continue;
        }
        const jis = (a ?? 0x222e) + (0xa0a0 - 0x2020); // 〓
        if (jis >= 0x100) {
            buf[off++] = jis >> 8;
            buf[off++] = jis & 0xff;
        }
        else {
            buf[off++] = jis;
        }
    }
    return buf.subarray(0, off);
}
function stripStringEUCJP(input, maxBytes) {
    // 1, 2バイト文字しか存在しない
    if (input.length * 2 < maxBytes) {
        return input;
    }
    let bytes = 0;
    for (let i = 0; i < input.length; i++) {
        const c = input.charCodeAt(i);
        const size = c < 0x80 ? 1 : 2;
        if (bytes + size > maxBytes) {
            return input.substring(0, i);
        }
        bytes += size;
    }
    return input;
}
//# sourceMappingURL=euc_jp.js.map