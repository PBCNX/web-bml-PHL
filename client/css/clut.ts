import { defaultCLUT } from './default_clut';
import { type Logger } from "../util/logger";

/** The 256-entry base a CLUT starts from; entries a stream does not set stay opaque black. */
function defaultTable(): number[][] {
    const table = defaultCLUT.slice();
    const prevLength = table.length;
    table.length = 256;
    return table.fill([0, 0, 0, 255], prevLength, 256);
}

/**
 * Decodes a CLUT section. A CLUT this function cannot read answers `defaultCLUT` — the same array a
 * *missing* CLUT gives, so the two fallbacks have one shape — and logs why: it used to log for one
 * unreadable case, say "unexpected" for another and throw for a third, while its callers only fell
 * back to the default for a *missing* file.
 */
export function readCLUT(clut: Uint8Array<ArrayBuffer>, logger: Logger): number[][] {
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
        logger.error(`region is not operated`);
        // The offsets below would read the wrong bytes. Answer the same array a missing CLUT does.
        return defaultCLUT.slice();
    }
    let startIndex: number;
    let endIndex: number;
    if (startEndFlag) {
        if (depth == 0) {
            startIndex = clut[index] >> 4;
            endIndex = clut[index] & 15;
            index++;
        } else if (depth == 1) {
            // start_indexは17のみが運用される
            startIndex = clut[index++];
            // end_ndexは223のみが運用される
            endIndex = clut[index++];
        } else if (depth == 2) {
            startIndex = clut[index++];
            startIndex = (startIndex << 8) | clut[index++];
            endIndex = clut[index++];
            endIndex = (endIndex << 8) | clut[index++];
        } else {
            logger.error(`unexpected clut depth`, depth);
            return defaultCLUT.slice();
        }
        for (let i = startIndex; i <= endIndex; i++) {
            let R: number;
            let G: number;
            let B: number;
            if (clutType == 0) {
                // A CLUT that ends mid-entry would fill the table with NaN, which the renderer shows
                // as #NaNNaNNaNNaN: answer the default instead.
                if (index + 3 >= clut.length) {
                    logger.error(`clut ends mid-entry`);
                    return defaultCLUT.slice();
                }
                const Y = clut[index++];
                const Cb = clut[index++];
                const Cr = clut[index++];
                R = Math.max(0, Math.min(255, Math.floor((Y - 16) * 1.16438 + 1.79274 * (Cr - 128))));
                G = Math.max(0, Math.min(255, Math.floor((Y - 16) * 1.16438 + -0.213249 * (Cb - 128) -0.532909 * (Cr - 128))));
                B = Math.max(0, Math.min(255, Math.floor((Y - 16) * 1.16438 + 2.1124 * (Cb - 128))));
            } else if (index + 3 >= clut.length) {
                logger.error(`clut ends mid-entry`);
                return defaultCLUT.slice();
            } else {
                R = clut[index++];
                G = clut[index++];
                B = clut[index++];
            }
            // Aは0以外が運用される
            const A = clut[index++];
            table[i] = [R, G, B, A];
        }
    } else {
        // 運用されない
        logger.error(`start_end_flag = 0 is not operated`);
        return defaultCLUT.slice();
    }
    return table;
}
