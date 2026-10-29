"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.originalFromCharCode = exports.originalCharCodeAt = void 0;
exports.eucJPCharCodeAt = eucJPCharCodeAt;
exports.eucJPFromCharCode = eucJPFromCharCode;
exports.shiftJISCharCodeAt = shiftJISCharCodeAt;
exports.shiftJISFromCharCode = shiftJISFromCharCode;
// STD-B24 第二編 付属2 5.4.3.4で定められている挙動をするようにする
// 比較もEUC-JPベースでやる必要はある
const unicode_to_jis_map_1 = require("./unicode_to_jis_map");
const jis_to_unicode_map_1 = require("./jis_to_unicode_map");
const shift_jis_1 = require("./shift_jis");
exports.originalCharCodeAt = String.prototype.charCodeAt;
exports.originalFromCharCode = String.fromCharCode;
function eucJPCharCodeAt(index) {
    const orig = exports.originalCharCodeAt.call(this, index);
    if (Number.isNaN(orig)) {
        return orig;
    }
    const jis = unicode_to_jis_map_1.unicodeToJISMap[orig];
    if (jis == null) {
        return orig;
    }
    return jis + (0xa0a0 - 0x2020);
}
function eucJPFromCharCode(...codes) {
    return (0, exports.originalFromCharCode)(...codes.flatMap(code => {
        const code1 = (code >> 8) & 0xff;
        const code2 = code & 0xff;
        if (code1 >= 0xa1 && code1 <= 0xfe) {
            if (code2 >= 0xa1 && code2 <= 0xfe) {
                const j = jis_to_unicode_map_1.jisToUnicodeMap[(code1 - 0xa1) * 94 + code2 - 0xa1];
                if (typeof j === "number") {
                    return [j];
                }
                return j;
            }
        }
        return [code];
    }));
}
function shiftJISCharCodeAt(index) {
    const orig = exports.originalCharCodeAt.call(this, index);
    if (Number.isNaN(orig)) {
        return orig;
    }
    const result = (0, shift_jis_1.encodeShiftJIS)((0, exports.originalFromCharCode)(orig));
    if (result.length >= 2) {
        return (result[0] << 8) | result[1];
    }
    return result[0];
}
function shiftJISFromCharCode(...codes) {
    return (0, exports.originalFromCharCode)(...codes.flatMap(code => {
        const code2 = (code >> 8) & 0xff;
        const code1 = code & 0xff;
        if (code2 !== 0) {
            return [(0, shift_jis_1.decodeShiftJIS)(new Uint8Array([code2, code1])).charCodeAt(0)];
        }
        else if (code >= 0x80) {
            return [(0, shift_jis_1.decodeShiftJIS)(new Uint8Array([code])).charCodeAt(0)];
        }
        else {
            return [code];
        }
    }));
}
//# sourceMappingURL=string.js.map