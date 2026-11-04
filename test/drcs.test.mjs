// drcs.ts was the last decoder that threw on data it could not read. The BML spec never operates
// geometric DRCS, so a stream carrying it made loadDRCS throw all the way through the async
// browser API instead of returning the glyphs it could read.
import test from "node:test";
import assert from "node:assert/strict";

import { loadDRCS, toTTF } from "../dist/client/media/drcs.js";

// [nCode, charCode1, charCode2, nFont, (fontId << 4 | mode)]
const geometric = (mode) => Uint8Array.from([1, 0x21, 0x21, 1, (2 << 4) | mode]);
/** A complete operational glyph: 8x8 at depth 2 needs 16 bitmap bytes. */
function operationalGlyph(charCode1 = 0x21, charCode2 = 0x21) {
    return [charCode1, charCode2, 1, 0x10, 2, 8, 8, ...new Array(16).fill(0xaa)];
}

test("a geometric font is skipped, not thrown on", () => {
    // mode 2-15 are geometric; the glyph carries nothing readable, so it is dropped
    for (const mode of [2, 15]) {
        assert.deepEqual(loadDRCS(geometric(mode)), [], `mode ${mode} should drop the glyph`);
    }
});

test("an operational font still parses, so skipping is not skipping everything", () => {
    // mode 0 with a 16px maru-gothic cell: one glyph follows and must survive
    const payload = Uint8Array.from([1, ...operationalGlyph()]);
    const glyphs = loadDRCS(payload);

    assert.equal(glyphs.length, 1, "an operational glyph must still be returned");
    assert.notEqual(glyphs[0].glyphs.length, 0);
});

test("an empty glyph set still converts to a TTF", () => {
    // toTTF sums the whole font with a running checksum; a non-multiple-of-4 tail used to hit a
    // branch that threw "unreachable" after computing the sum.
    const { ttf, unicodeCharacters } = toTTF([]);

    assert.notEqual(ttf.length, 0);
    assert.deepEqual(unicodeCharacters, []);
});
test("a geometric font mid-payload stops parsing instead of desyncing", () => {
    // The offset of the next entry cannot be computed past a geometric font, so continuing read
    // garbage as a font size. A trailing glyph used to survive by luck; this is the mid-stream case.
    const payload = Uint8Array.from([
        2,
        ...operationalGlyph(),                       // a complete 8x8 glyph
        0x21, 0x22, 1, 0x22,                         // geometric font for the next glyph
        0x7f, 0x7f, 0x7f,                            // bytes that used to be misread
    ]);

    const glyphs = loadDRCS(payload);

    assert.equal(glyphs.length, 1, "the glyph read before the geometric font is kept");
    assert.equal(glyphs[0].ku, 1);
});
test("a truncated glyph header stops parsing instead of throwing RangeError", () => {
    // width/height read past the end left them undefined, and new Array(NaN) throws.
    for (const payload of [[1, 0x21, 0x21, 1, 0x10], [1, 0x21, 0x21, 1, 0x10, 2, 8, 8, 0xff]]) {
        assert.deepEqual(loadDRCS(Uint8Array.from(payload)), [], `payload ${payload.length} bytes should stop cleanly`);
    }
});