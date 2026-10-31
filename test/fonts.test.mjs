// C13 — the font the PH pages get, measured off the woff2 the engine ships.
//
// Two properties matter, and they are different properties:
//
//   1. monospaced Latin, because PH BML lays text out with spaces and the engine's cell model is
//      half-width ASCII — measured here as every ASCII advance equal;
//   2. the PH character set (Annex 8 Table A8-1-2: Latin-1 + Ñ/ñ + the ARIB symbol block), because a
//      face that cannot draw ñ hands that character to a fallback font, which changes both the glyph
//      and the advance in the middle of a label.
//
// Measured 2026-10-27: all three faces the engine ships are monospaced at 0.5 em for ASCII, and none
// of them has a glyph for ñ, Ñ, é or á. The first test passes; the second is `todo` so the gap is
// visible in `npm test` without failing a build that has not chosen a font yet.
//
// The parser is deliberately local: Node's Brotli plus the woff2 table directory is enough to read
// cmap and hmtx, and a test must not depend on a font library that a clean clone would have to
// install.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { brotliDecompressSync } from "node:zlib";
import { defaultCSS } from "../dist/client/css/default_css.js";
import { defaultCProfileCSS } from "../dist/client/css/default_c_css.js";

const KNOWN_TAGS = [
    "cmap", "head", "hhea", "hmtx", "maxp", "name", "OS/2", "post", "cvt ", "fpgm", "glyf", "loca",
    "prep", "CFF ", "VORG", "EBDT", "EBLC", "gasp", "hdmx", "kern", "LTSH", "PCLT", "VDMX", "vhea",
    "vmtx", "BASE", "GDEF", "GPOS", "GSUB", "EBSC", "JSTF", "MATH", "CBDT", "CBLC", "COLR", "CPAL",
    "SVG ", "sbix", "acnt", "avar", "bdat", "bloc", "bsln", "cvar", "fdsc", "feat", "fmtx", "fvar",
    "gvar", "hsty", "just", "lcar", "mort", "morx", "opbd", "prop", "trak", "Zapf", "Silf", "Glat",
    "Gloc", "Feat", "Sill",
];

function readBase128(buf, pos) {
    let value = 0;
    for (let i = 0; i < 5; i++) {
        const byte = buf[pos++];
        value = (value << 7) | (byte & 0x7f);
        if (!(byte & 0x80)) {
            return [value, pos];
        }
    }
    throw new Error("UIntBase128 too long");
}

function parseWoff2(buf) {
    if (buf.toString("latin1", 0, 4) !== "wOF2") {
        throw new Error("not WOFF2");
    }
    const numTables = buf.readUInt16BE(12);
    const totalCompressedSize = buf.readUInt32BE(20);
    let pos = 48;
    const tables = [];
    for (let i = 0; i < numTables; i++) {
        const flags = buf[pos++];
        const tagIndex = flags & 0x3f;
        const transformVersion = (flags >> 6) & 0x03;
        const tag = tagIndex === 63 ? buf.toString("latin1", pos, (pos += 4)) : KNOWN_TAGS[tagIndex];
        let origLength;
        [origLength, pos] = readBase128(buf, pos);
        let transformLength = null;
        const transformed = (tag === "glyf" || tag === "loca")
            ? transformVersion !== 3
            : (tag === "hmtx" && transformVersion === 1);
        if (transformed) {
            [transformLength, pos] = readBase128(buf, pos);
        }
        tables.push({ tag, origLength, transformLength, transformed });
    }
    const data = brotliDecompressSync(buf.subarray(pos, pos + totalCompressedSize));
    const out = new Map();
    let off = 0;
    for (const t of tables) {
        const len = t.transformed ? t.transformLength : t.origLength;
        out.set(t.tag, data.subarray(off, off + len));
        off += len;
    }
    return out;
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

function fontMetrics(file) {
    const tables = parseWoff2(readFileSync(file));
    const { head, hhea, hmtx, cmap } = Object.fromEntries(
        ["head", "hhea", "hmtx", "cmap"].map((tag) => [tag, tables.get(tag)]));
    const unitsPerEm = head.readUInt16BE(18);
    const numberOfHMetrics = hhea.readUInt16BE(34);
    const sub = format4Subtable(cmap);
    const glyph = (code) => glyphFor(cmap, sub, code);
    const advance = (code) => {
        const g = glyph(code);
        if (g === 0) {
            return null;
        }
        return g < numberOfHMetrics ? hmtx.readUInt16BE(g * 4) : hmtx.readUInt16BE((numberOfHMetrics - 1) * 4);
    };
    return { unitsPerEm, glyph, advance };
}

const fontDir = join(import.meta.dirname, "..", "fonts");
const faces = readdirSync(fontDir).filter((name) => name.endsWith(".woff2"));

// The faces a host may use as the primary BML face must be ASCII-monospaced. PHLatin and MPLUS1P are
// fallbacks only — M PLUS 1p is proportional Latin by design, reached only for ranges the primary
// lacks — so they are checked separately below.
const bmlFaces = faces.filter((name) => name.startsWith("Kosugi") || name.startsWith("MPLUS1Code") ||
    (name.startsWith("BMLPH-Sans") && !name.startsWith("BMLPH-Sans-")));

test("every BML face is monospaced for ASCII", () => {
    assert.ok(bmlFaces.length > 0);
    for (const face of bmlFaces) {
        const { unitsPerEm, advance } = fontMetrics(join(fontDir, face));
        const widths = new Set();
        // The printable ASCII range, not a sample: a face is only monospaced if all of it is.
        for (let code = 0x20; code <= 0x7e; code++) {
            const w = advance(code);
            assert.notEqual(w, null, `${face}: no glyph for U+${code.toString(16).toUpperCase()}`);
            widths.add(w);
        }
        assert.equal(widths.size, 1, `${face}: ASCII advances differ (${[...widths].join(", ")})`);
        assert.equal([...widths][0], unitsPerEm / 2, `${face}: ASCII cell is not half an em`);
    }
});

test("the PH Latin fallback covers the accented set in the same half-em cell", () => {
    // Annex 8 Table A8-1-2: Latin-1 + Ñ/ñ. These are exactly the characters the BML faces lack
    // (measured: 3 of 64 Latin-1 letters in KosugiMaru), so they are what the fallback exists for.
    const required = [0xf1, 0xd1, 0xe9, 0xe1, 0xfa, 0xf3, 0xed, 0xfc, 0xbf, 0xa1, 0xba, 0xaa];
    const { unitsPerEm, glyph, advance } = fontMetrics(join(fontDir, "PHLatin-Regular.woff2"));
    const missing = required.filter((code) => glyph(code) === 0);
    assert.deepEqual(missing, [], `PHLatin missing ${missing.map((c) => "U+" + c.toString(16).toUpperCase()).join(" ")}`);
    for (const code of required) {
        assert.equal(advance(code), unitsPerEm / 2,
            `PHLatin U+${code.toString(16).toUpperCase()} is not half an em — a fallback char would move the cell`);
    }
});

test("the default CSS asks for PH Latin, then the BML fallback, then the last resort, in that order", () => {
    // The wiring that makes a registered fallback apply to a page's text. If someone drops a step
    // from the stack, `ñ` or a symbol silently goes back to a proportional system face.
    // Asserted against the exported stylesheet strings, not the .ts sources: a refactor of how the
    // strings are built must not fail this, while a missing stack step must.
    for (const [name, css] of [["default_css", defaultCSS], ["default_c_css", defaultCProfileCSS]]) {
        assert.match(css, /"丸ゴシック", "PH Latin"/, `${name} no longer names the PH Latin fallback`);
        assert.match(css, /"PH Latin", "BML Fallback"/, `${name} no longer names the BML fallback after PH Latin`);
        // C13: the M+ stack's last resort, for a character neither the primary nor MPLUS1P has.
        assert.match(css, /"BML Fallback", "BML Last Resort"/, `${name} no longer names the last resort after the BML fallback`);
    }
});

test("the shipped all-M+ pair keeps the BML cells in the ranges it supplies", () => {
    // The complete M+ configuration: M PLUS 1 Code as the primary (Latin and accents at 0.5 em,
    // kana and kanji at 1 em) and M PLUS 1p as the fallback (full-width forms at 1 em, half-width
    // kana at 0.5 em). Both must be exact, or the stack moves text.
    const code = fontMetrics(join(fontDir, "MPLUS1Code-Regular.woff2"));
    for (const [what, codes] of [["ASCII", Array.from({ length: 95 }, (_, i) => 0x20 + i)]]) {
        for (const cp of codes) {
            assert.equal(code.advance(cp), code.unitsPerEm / 2, `1 Code ${what} U+${cp.toString(16)}`);
        }
    }
    for (const cp of [0xf1, 0xd1, 0xe9, 0xe1]) {
        assert.equal(code.advance(cp), code.unitsPerEm / 2, `1 Code accent U+${cp.toString(16)}`);
    }
    for (const cp of [0x3042, 0x30c6, 0x8996]) {
        assert.equal(code.advance(cp), code.unitsPerEm, `1 Code kana/kanji U+${cp.toString(16)}`);
    }

    const p = fontMetrics(join(fontDir, "MPLUS1P-Regular.woff2"));
    for (const cp of [0xff21, 0xff22, 0xff11]) { // Ａ Ｂ １
        assert.notEqual(p.glyph(cp), 0, `1p full-width U+${cp.toString(16)} missing`);
        assert.equal(p.advance(cp), p.unitsPerEm, `1p full-width U+${cp.toString(16)} is not 1 em`);
    }
    for (const cp of [0xff71, 0xff72, 0xff73]) { // ｱ ｲ ｳ
        assert.notEqual(p.glyph(cp), 0, `1p half-width kana U+${cp.toString(16)} missing`);
        assert.equal(p.advance(cp), p.unitsPerEm / 2, `1p half-width kana U+${cp.toString(16)} is not 0.5 em`);
    }
});


// C13, 2.1.0 - the PH face. Noto's own accents, all of them in the 0.5 em cell the engine's layout
// assumes; the cell is measured as advance 500 on the letters a PH label actually uses.
const PH_LETTERS = [0x6e, 0xf1, 0xd1, 0xe1, 0xe9, 0xed, 0xf3, 0xfa, 0xfc];

test("BML-PH Sans draws the PH letters in the 0.5 em cell", () => {
    for (const face of ["BMLPH-Sans-Regular.woff2", "BMLPH-SansLite-Regular.woff2"]) {
        const { unitsPerEm, advance } = fontMetrics(join(fontDir, face));
        for (const code of PH_LETTERS) {
            assert.equal(advance(code), unitsPerEm / 2, `${face}: U+${code.toString(16)} must be 0.5 em`);
        }
        assert.equal(advance(0x3000), unitsPerEm, `${face}: U+3000 must be 1 em`);
        assert.equal(advance(0x2103), unitsPerEm, `${face}: U+2103 must be 1 em`);
    }
});

// 2.2.0 - the scripts a PH page mixes: the peso sign and half-width kana in the 0.5 em cell,
// Greek and Cyrillic in the 1 em (double-byte) cell.
test("BML-PH Sans 2.2.0 carries the script set in the right cells", () => {
    for (const face of ["BMLPH-Sans-Regular.woff2", "BMLPH-SansLite-Regular.woff2"]) {
        const { unitsPerEm, advance } = fontMetrics(join(fontDir, face));
        assert.equal(advance(0x20b1), unitsPerEm / 2, `${face}: the peso sign must be 0.5 em`);
        for (let code = 0xff61; code <= 0xff9f; code++) {
            assert.equal(advance(code), unitsPerEm / 2, `${face}: half-width kana U+${code.toString(16)} must be 0.5 em`);
        }
        for (const code of [0x3b1, 0x3a9, 0x410, 0x42f]) {
            assert.equal(advance(code), unitsPerEm, `${face}: U+${code.toString(16)} must be 1 em`);
        }
        assert.equal(advance(0x3000), unitsPerEm, `${face}: U+3000 must be 1 em`);
    }
});
