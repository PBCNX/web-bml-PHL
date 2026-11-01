// The ink-inside-the-cell check BMLPLAYER asked for: every letter in U+A0-24F must sit inside its
// 0.5 em cell, not merely advance by 500. Reads the .ttf faces (glyf/loca are uncompressed there, so
// the bounding box is the glyph's own), and is deliberately local: no font library.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const fontDir = join(import.meta.dirname, "..", "fonts");

function readTables(buf) {
    const numTables = buf.readUInt16BE(4);
    const tables = new Map();
    for (let i = 0; i < numTables; i++) {
        const rec = 12 + i * 16;
        const tag = buf.toString("latin1", rec, rec + 4);
        const offset = buf.readUInt32BE(rec + 8);
        const length = buf.readUInt32BE(rec + 12);
        tables.set(tag, buf.subarray(offset, offset + length));
    }
    return tables;
}

function format4Subtable(cmap) {
    const count = cmap.readUInt16BE(2);
    for (let i = 0; i < count; i++) {
        const off = cmap.readUInt32BE(4 + i * 8 + 4);
        if (cmap.readUInt16BE(off) === 4) {
            return off;
        }
    }
    return null;
}

function glyphFor(cmap, sub, code) {
    const segX2 = cmap.readUInt16BE(sub + 6);
    const endBase = sub + 14;
    const startBase = endBase + segX2 + 2;
    const deltaBase = startBase + segX2;
    const rangeBase = deltaBase + segX2;
    for (let s = 0; s < segX2 / 2; s++) {
        const end = cmap.readUInt16BE(endBase + s * 2);
        const start = cmap.readUInt16BE(startBase + s * 2);
        if (code < start || code > end) {
            continue;
        }
        const delta = cmap.readInt16BE(deltaBase + s * 2);
        const rangeOff = cmap.readUInt16BE(rangeBase + s * 2);
        if (rangeOff === 0) {
            return (code + delta) & 0xffff;
        }
        const glyph = cmap.readUInt16BE(rangeBase + s * 2 + rangeOff + (code - start) * 2);
        return glyph === 0 ? 0 : (glyph + delta) & 0xffff;
    }
    return 0;
}

function metrics(file) {
    const tables = readTables(readFileSync(file));
    const head = tables.get("head");
    const hhea = tables.get("hhea");
    const hmtx = tables.get("hmtx");
    const maxp = tables.get("maxp");
    const loca = tables.get("loca");
    const glyf = tables.get("glyf");
    const cmap = tables.get("cmap");
    const unitsPerEm = head.readUInt16BE(18);
    const longLoca = head.readInt16BE(50) === 1;
    const numberOfHMetrics = hhea.readUInt16BE(34);
    const numGlyphs = maxp.readUInt16BE(4);
    const sub = format4Subtable(cmap);
    const locaAt = (g) => (longLoca ? loca.readUInt32BE(g * 4) : loca.readUInt16BE(g * 2) * 2);
    const advance = (code) => {
        const g = glyphFor(cmap, sub, code);
        if (g === 0) {
            return null;
        }
        return g < numberOfHMetrics ? hmtx.readUInt16BE(g * 4) : hmtx.readUInt16BE((numberOfHMetrics - 1) * 4);
    };
    const bounds = (code) => {
        const g = glyphFor(cmap, sub, code);
        if (g === 0 || g >= numGlyphs) {
            return null;
        }
        const start = locaAt(g);
        const end = locaAt(g + 1);
        if (end <= start) {
            return { empty: true };
        }
        // glyf header: numberOfContours (2), xMin (2), yMin (2), xMax (2), yMax (2)
        return { xMin: glyf.readInt16BE(start + 2), xMax: glyf.readInt16BE(start + 6), empty: false };
    };
    return { unitsPerEm, advance, bounds };
}

const faces = ["BMLPH-Sans-Regular.ttf", "BMLPH-SansLite-Regular.ttf", "BMLPH-Sans-Bold.ttf", "BMLPH-SansLite-Bold.ttf"]
    .filter((name) => existsSync(join(fontDir, name)));

test("every accented Latin letter sits inside its 0.5 em cell", () => {
    assert.ok(faces.length === 4, "the four BML-PH Sans faces must ship");
    for (const face of faces) {
        const { advance, bounds } = metrics(join(fontDir, face));
        for (let code = 0xa0; code <= 0x24f; code++) {
            if (advance(code) === null) {
                continue;
            }
            assert.equal(advance(code), 500, `${face}: U+${code.toString(16)} must advance 0.5 em`);
            const b = bounds(code);
            if (!b || b.empty) {
                continue;
            }
            assert.ok(b.xMin >= 0, `${face}: U+${code.toString(16)} ink starts at ${b.xMin}, outside the cell`);
            assert.ok(b.xMax <= 500, `${face}: U+${code.toString(16)} ink ends at ${b.xMax}, outside the cell`);
        }
    }
});

test("the base letters and their accents share a width", () => {
    for (const face of faces) {
        const { bounds } = metrics(join(fontDir, face));
        for (const [base, accented] of [[0x6e, 0xf1], [0x4e, 0xd1], [0x61, 0xe1], [0x6f, 0xf3]]) {
            const b = bounds(base);
            const a = bounds(accented);
            if (!a || a.empty) {
                continue;
            }
            assert.ok(Math.abs((a.xMax - a.xMin) - (b.xMax - b.xMin)) <= 2,
                `${face}: U+${accented.toString(16)} ink differs from U+${base.toString(16)}`);
        }
    }
});
