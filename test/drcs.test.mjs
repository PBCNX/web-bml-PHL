import test from "node:test";
import assert from "node:assert/strict";

import { loadDRCS, toTTF } from "../dist/client/drcs.js";

// The QC pass found drcs.ts was the last decoder that threw on data it could not read:
//   - checksum() summed the trailing 1-3 bytes and then threw "unreachable" on every one of those
//     branches, so a font whose byte length was not a multiple of 4 crashed while generating the TTF;
//   - a geometric font (mode 2-15, which STD-B24 never operates) threw and lost the whole payload,
//     including the glyphs that were readable.
// A malformed payload now answers an empty set / a skipped font, and BrowserAPI.loadDRCS turns any
// remaining failure into NaN instead of a rejected promise.

test("a geometric font is skipped and the payload survives", () => {
    // nCode=1, char 0x2121 (kuten 1-1), nFont=1, b=0x12 -> fontId 1, mode 2 (geometric).
    const payload = Uint8Array.from([0x01, 0x21, 0x21, 0x01, 0x12]);
    const glyphs = loadDRCS(payload);
    assert.deepEqual(glyphs, [], "a geometric-only payload yields no glyph set, not a throw");
});

test("an operational font still parses after the geometric one before it", () => {
    // The same payload plus a second font in mode 1: depth 0, 16x16, 2 bits per pixel (64 bytes).
    const payload = Uint8Array.from([
        0x01, 0x21, 0x21, 0x02,       // one char, two fonts
        0x12,                          // geometric -> skipped
        0x11, 0x00, 0x10, 0x10,        // mode 1, depth 0, 16x16
        ...new Array(64).fill(0xff),   // bitmap
    ]);
    const glyphs = loadDRCS(payload);
    assert.equal(glyphs.length, 1, "the char's readable glyph set is kept");
    assert.equal(glyphs[0].glyphs.length, 1);
    assert.equal(glyphs[0].glyphs[0].width, 16);
    assert.equal(glyphs[0].glyphs[0].height, 16);
});

test("an empty glyph set converts to a TTF instead of throwing", () => {
    const { ttf, unicodeCharacters } = toTTF([]);
    assert.ok(ttf.length > 0, "a font with no glyphs still produces a font");
    assert.deepEqual(unicodeCharacters, []);
});
