// P7 — the ARIB text designation rule, on bytes.
//
// The fixtures come from two places, and each line says which:
//
//   - TVTest\docs\arib-text-shift.md §3.5 measured the two `.btb` fields byte for byte: GMA's text
//     carries no designation at all (`4B 61 70 75 73 6F` = "Kapuso"), TV5's carries `0E` (LS1) before
//     "Test Broadcast".
//   - This repo's own corpus measurement (docs/PATCHES.md, P7) found ABS-CBN's `.btb` text is UTF-8 with
//     `ñ`: `Parañaque City` reaches the page as `Para単aque City` today.
//
// Run with `npm test` after `npm run build`. Every case names what it would have been before P7, so
// a regression is readable without the old build.
import test from "node:test";
import assert from "node:assert/strict";
import { decodeARIBText, tableTextCoding } from "../dist/client/media/arib_text.js";
import { decodeEUCJP } from "../dist/client/charset/euc_jp.js";
import { decodeShiftJIS } from "../dist/client/charset/shift_jis.js";

/** Bytes from a hex string, so a fixture reads like the measurement it came from. */
const b = (hex) => new Uint8Array(hex.split(/\s+/).filter(Boolean).map((x) => parseInt(x, 16)));
const ascii = (s) => new Uint8Array([...s].map((c) => c.charCodeAt(0)));

test("GMA: a field with no designation reads as its letters", () => {
    // 4B 61 70 75 73 6F "Kapuso Mall Show in Batangas" — no 0E, no ESC anywhere in the field.
    const field = ascii("Kapuso Mall Show in Batangas");
    assert.equal(decodeARIBText(field, decodeEUCJP), "Kapuso Mall Show in Batangas");
    // Under the A-profile fallback this was never the glyph path — EUC-JP is ASCII for 7-bit bytes.
    // The lenient rule's job for this field is to stay true when the fallback is Shift_JIS, where
    // 0x5C is U+00A5 and 0x7E is U+203E.
    const legacy = ascii("F|K\\");
    assert.equal(decodeARIBText(legacy, decodeShiftJIS), decodeShiftJIS(legacy),
        "a field 日本's bytes (46 7C 4B 5C) must not be claimed by the lenient rule");
});

test("TV5: LS1 is honoured, and the control does not leak into the string", () => {
    // 0E 54 65 73 74 20 42 72 6F 61 64 63 61 73 74 — "Test Broadcast" after LS1.
    const field = b("0E 54 65 73 74 20 42 72 6F 61 64 63 61 73 74");
    // Before P7: the parser had no designation handling, so the field decoded to "\u000ETest
    // Broadcast" — the LS1 byte became a character in the page's string.
    assert.equal(decodeEUCJP(field), "\u000ETest Broadcast");
    assert.equal(decodeARIBText(field, decodeEUCJP), "Test Broadcast");
    assert.ok(!decodeARIBText(field, decodeEUCJP).includes("\u000E"));
    // The designation is honoured whatever the host's policy is: this field *does* declare itself.
    assert.equal(decodeARIBText(field, decodeEUCJP, "arib"), "Test Broadcast");
});

test("a designated kanji field decodes as JIS X 0208", () => {
    // 1B 28 42 (G0 <- Kanji) then 46 7C 4B 5C = 日本 in GL: two 7-bit pairs.
    const field = b("1B 28 42 46 7C 4B 5C");
    assert.equal(decodeARIBText(field, decodeEUCJP), "日本");
    // Before P7 the escape bytes were emitted as characters and the pairs read as ASCII.
    assert.equal(decodeEUCJP(field), "\u001B(BF|K\\");
    // A conformant Japanese alphanumeric designation keeps web-bml's half-width drawing, so no
    // glyph on a conformant page moves (TVTest draws these full-width; web-bml never did).
    assert.equal(decodeARIBText(b("1B 28 4A 54 42 53 31"), decodeEUCJP), "TBS1");
});

test("conformant 8-bit text takes the profile's decoder, unchanged", () => {
    // EUC-JP あ = A4 A2. Valid in no other coding, so it is a real guard: the field carries GR
    // bytes and no designation, and must not be reinterpreted.
    const field = b("A4 A2");
    assert.equal(decodeEUCJP(field), "あ");
    assert.equal(decodeARIBText(field, decodeEUCJP, "auto"), "あ");
    assert.equal(decodeARIBText(field, decodeEUCJP, "arib"), "あ");
    // A Japanese .btb string in EUC-JP: 日本 = C6 FC CB DC is not valid UTF-8, so it stays.
    assert.equal(decodeARIBText(b("C6 FC CB DC"), decodeEUCJP), "日本");
});

test("PH text is UTF-8: a place name keeps its ñ", () => {
    // "Parañaque City" as the PH standard codes it (Annex 8: UTF-8); ñ = C3 B1.
    const field = new Uint8Array([...ascii("Para"), 0xC3, 0xB1, ...ascii("aque City")]);
    // Before P7 the profile's EUC-JP decoder read C3 B1 as one JIS pair — the measured garble.
    const before = decodeEUCJP(field);
    assert.ok(!before.includes("ñ") && /[\u3000-\u9fff]/.test(before), `expected kanji mush, got ${JSON.stringify(before)}`);
    assert.equal(decodeARIBText(field, decodeEUCJP), "Parañaque City");
    // ... and `arib` is the opt-out that keeps a host on upstream's strict reading.
    assert.equal(decodeARIBText(field, decodeEUCJP, "arib"), before);
});

test("valid UTF-8 wins over the profile decoder only in `auto`", () => {
    // Las Piñas City — the same corpus class, and a field with no designation of any kind.
    const field = new Uint8Array([...ascii("Las Pi"), 0xC3, 0xB1, ...ascii("as City")]);
    assert.equal(decodeARIBText(field, decodeEUCJP, "auto"), "Las Piñas City");
    assert.equal(decodeARIBText(field, decodeEUCJP, "arib"), decodeEUCJP(field));
});

test("an empty field is empty", () => {
    assert.equal(decodeARIBText(new Uint8Array(0), decodeEUCJP), "");
});

test("a designation this decoder does not have falls back, it does not guess", () => {
    // ESC 2A (G2 designation) then a byte: G2 is hiragana in the SI defaults, and this decoder has no
    // hiragana table, so the whole field goes to the profile's decoder rather than being half-read.
    const field = b("1B 2A 4A 21 21");
    assert.equal(decodeARIBText(field, decodeEUCJP), decodeEUCJP(field));
});

test("the corpus's non-Latin characters are UTF-8 too", () => {
    // GMA's earthquake RSS: "Location = 16.94°N" — the degree sign is C2 B0 in UTF-8, and under
    // EUC-JP it was read as 属 (the measured garble in docs/PATCHES.md).
    const degrees = new Uint8Array([...ascii("16.94"), 0xC2, 0xB0, ...ascii("N")]);
    assert.equal(decodeARIBText(degrees, decodeEUCJP), "16.94°N");
    assert.notEqual(decodeARIBText(degrees, decodeEUCJP), decodeEUCJP(degrees));
    // TV5's Twitter text carries emoji: 🎂 = F0 9F 8E 82, valid UTF-8 and nothing else.
    assert.equal(decodeARIBText(b("F0 9F 8E 82"), decodeEUCJP), "🎂");
});

test("a control byte is not a kanji lead", () => {
    // The corpus contains .btb segments whose first byte is a length, not a designation: `0F` is 15
    // and the 15 bytes after it are " (074) 304-2256". Read as LS0 the rest would become kanji —
    // `�扱刊�梓�乙喬` — so a GL pair whose lead is not 0x21–0x7E must fall back, not guess.
    const lengthPrefixed = b("0F 20 28 30 37 34 29 20 33 30 34 2D 32 32 35 36 2C");
    assert.equal(decodeARIBText(lengthPrefixed, decodeEUCJP), decodeEUCJP(lengthPrefixed));
    assert.ok(!/[\u3000-\u9fff]/.test(decodeARIBText(lengthPrefixed, decodeEUCJP)));
    // Same shape with a record header before an LS1: `01 2A` is not a kanji pair.
    const recordHeader = b("01 2A 0E 32 30 32 31 30 34 31 37 31 36 32 31 32 38");
    assert.equal(decodeARIBText(recordHeader, decodeEUCJP), decodeEUCJP(recordHeader));
});

test("C1 controls are C280–C29F, and a raw C1 byte is not UTF-8", () => {
    // Annex 8 A8-1-1: C1 (0x80–0x9F) is coded as 0xC280–0xC29F in UTF-8. So the two-byte sequence
    // is one code point after decoding, not two characters, and not a glyph.
    for (const hex of ["C2 80", "C2 85", "C2 9B", "C2 9F"]) {
        const decoded = decodeARIBText(b(hex), decodeEUCJP);
        assert.equal([...decoded].length, 1, `${hex} decodes to one code point`);
        assert.equal(decoded.charCodeAt(0), parseInt(hex.split(" ")[1], 16));
        assert.ok(decoded.charCodeAt(0) >= 0x80 && decoded.charCodeAt(0) <= 0x9f);
    }
    assert.equal(decodeARIBText(b("C2 85"), decodeEUCJP), "\u0085");
    assert.equal(decodeARIBText(b("C2 9B"), decodeEUCJP), "\u009b");
    // A raw C1 byte is not valid UTF-8, so the field is not claimed as UTF-8: the profile's decoder
    // decides, and EUC-JP does not invent a control character out of it.
    assert.notEqual(decodeARIBText(b("9B"), decodeEUCJP), "\u009b");
    assert.equal(decodeARIBText(b("9B"), decodeEUCJP), decodeEUCJP(b("9B")));
});



test("EUC-JP bytes that are also valid UTF-8 are not guessed", () => {
    // TBS's tables: 鉄道 = C5 B4 C6 BB and 道路 = C6 BB CF A9 are valid UTF-8 sequences ("Ŵƻ", "ƻϩ"),
    // so `auto` used to garble a Japanese table. A document that declares EUC-JP/Shift_JIS must get
    // the strict reading, whatever the host asked for.
    const euc = (hex) => Uint8Array.from(hex.match(/../g).map((h) => Number.parseInt(h, 16)));
    const jis = (input) => new TextDecoder("euc-jp").decode(input);

    assert.equal(decodeARIBText(euc("c5b4c6bb"), jis, "arib"), "鉄道");
    assert.equal(decodeARIBText(euc("c6bbcfa9"), jis, "arib"), "道路");
    assert.equal(decodeARIBText(euc("c5b4c6bb"), jis, "auto"), "Ŵƻ", "the ambiguity the rule has to avoid");

    assert.equal(tableTextCoding("EUC-JP", "auto"), "arib");
    assert.equal(tableTextCoding("euc-jp", "auto"), "arib");
    assert.equal(tableTextCoding("Shift_JIS", "auto"), "arib");
    assert.equal(tableTextCoding("UTF-8", "auto"), "auto", "a PH page still gets the PH reading");
    assert.equal(tableTextCoding(null, "auto"), "auto");
    assert.equal(tableTextCoding("EUC-JP", "arib"), "arib");
});