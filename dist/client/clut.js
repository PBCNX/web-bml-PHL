"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readCLUT = readCLUT;
const default_clut_1 = require("./default_clut");
/** The 256-entry table used when a CLUT is missing or cannot be read. */
function defaultTable() {
    const table = default_clut_1.defaultCLUT.slice();
    const prevLength = table.length;
    table.length = 256;
    return table.fill([0, 0, 0, 255], prevLength, 256);
}
/**
 * Decodes a CLUT section. A CLUT this function cannot read answers the default table and logs why:
 * it used to log and carry on for one unreadable case (reading the wrong bytes afterwards), say
 * "unexpected" for another and throw for a third, while its callers only fell back to the default for
 * a *missing* file.
 */
function readCLUT(clut, logger) {
    const table = defaultTable();
    // STD-B24 第二分冊(2/2) A3 5.1.7 表5-8参照
    // clut_typeは0(YCbCr)のみ運用される
    const clutType = clut[0] & 0x80;
    // depthは8ビット(1)のみが運用される
    const depth = (clut[0] & 0x60) >> 5;
    // region_flagは0のみが運用される
    const regionFlag = clut[0] & 0x10;
    // start_end_flagは1のみが運用される
    const startEndFlag = clut[0] & 0x8;
    let index = 1;
    if (regionFlag) {
        index += 2;
        index += 2;
        index += 2;
        index += 2;
        // 運用されない
        logger.error(`${logger.prefix}region is not operated`);
        // The offsets below would read the wrong bytes, so answer the default table instead.
        return table;
    }
    let startIndex;
    let endIndex;
    if (startEndFlag) {
        if (depth == 0) {
            startIndex = clut[index] >> 4;
            endIndex = clut[index] & 15;
            index++;
        }
        else if (depth == 1) {
            // start_indexは17のみが運用される
            startIndex = clut[index++];
            // end_ndexは223のみが運用される
            endIndex = clut[index++];
        }
        else if (depth == 2) {
            startIndex = clut[index++];
            startIndex = (startIndex << 8) | clut[index++];
            endIndex = clut[index++];
            endIndex = (endIndex << 8) | clut[index++];
        }
        else {
            logger.error(`${logger.prefix}unexpected clut depth`, depth);
            return table;
        }
        for (let i = startIndex; i <= endIndex; i++) {
            let R;
            let G;
            let B;
            if (clutType == 0) {
                const Y = clut[index++];
                const Cb = clut[index++];
                const Cr = clut[index++];
                R = Math.max(0, Math.min(255, Math.floor((Y - 16) * 1.16438 + 1.79274 * (Cr - 128))));
                G = Math.max(0, Math.min(255, Math.floor((Y - 16) * 1.16438 + -0.213249 * (Cb - 128) - 0.532909 * (Cr - 128))));
                B = Math.max(0, Math.min(255, Math.floor((Y - 16) * 1.16438 + 2.1124 * (Cb - 128))));
            }
            else {
                R = clut[index++];
                G = clut[index++];
                B = clut[index++];
            }
            // Aは0以外が運用される
            const A = clut[index++];
            table[i] = [R, G, B, A];
        }
    }
    else {
        // 運用されない
        logger.error(`${logger.prefix}start_end_flag = 0 is not operated`);
        return table;
    }
    return table;
}
//# sourceMappingURL=clut.js.map