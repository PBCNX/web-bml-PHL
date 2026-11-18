// P6 — the declared-charset rule, on bytes.
//
// P6's evidence was a before/after render of a UTF-8 page, the Village Island page and three
// fidelity fixtures. This test locks the part that can be locked without a renderer: which decoder a
// declaration selects, and that a page declaring the profile's own set decodes through the identical
// function it used before. The render comparisons remain in docs/PATCHES.md.
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCharset, getDeclaredTextDecoder, decodeUTF8, getTextDecoder } from "../dist/client/text.js";
import { decodeEUCJP } from "../dist/client/charset/euc_jp.js";
import { decodeShiftJIS } from "../dist/client/charset/shift_jis.js";
import { Profile } from "../dist/client/profile.js";

const bytes = (s) => new TextEncoder().encode(s);

test("charset names normalise to the decoders the engine has", () => {
    for (const name of ["UTF-8", "utf8", "US-ASCII", "ascii", " utf_8 "]) {
        assert.equal(normalizeCharset(name), "utf-8", name);
    }
    for (const name of ["Shift_JIS", "shift-jis", "sjis", "x-sjis", "MS_Kanji"]) {
        assert.equal(normalizeCharset(name), "shift-jis", name);
    }
    for (const name of ["EUC-JP", "x-euc-jp", "ujis", "euc_jp"]) {
        assert.equal(normalizeCharset(name), "euc-jp", name);
    }
    assert.equal(normalizeCharset(null), null);
    assert.equal(normalizeCharset(""), null);
    assert.equal(normalizeCharset("windows-1252"), "windows-1252");
});

test("a UTF-8 declaration decodes the Philippine name", () => {
    const field = bytes("Peñafrancia");
    // Before P6 the A-profile default (EUC-JP) read C3 B1 as one JIS pair: "Pe?afrancia" on screen.
    assert.notEqual(decodeEUCJP(field), "Peñafrancia");
    assert.equal(getDeclaredTextDecoder(Profile.TrProfileA, "UTF-8")(field), "Peñafrancia");
});

test("no declaration, or the profile's own set, is the profile's decoder", () => {
    const japanese = new Uint8Array([0xA4, 0xA2]); // EUC-JP あ
    const a = getDeclaredTextDecoder(Profile.TrProfileA, null);
    assert.equal(a, getTextDecoder(Profile.TrProfileA), "no declaration returns the identical function");
    assert.equal(a(japanese), "あ");
    // A declaration that *is* the profile's set returns the identical function too — that is what
    // makes "every EUC-JP page decodes exactly as before" true by construction, not by testing.
    assert.equal(getDeclaredTextDecoder(Profile.TrProfileA, "EUC-JP"), getTextDecoder(Profile.TrProfileA));
    assert.equal(getDeclaredTextDecoder(Profile.TrProfileC, "Shift_JIS"), getTextDecoder(Profile.TrProfileC));
});

test("a declaration of the other profile's set switches decoder", () => {
    // The Village Island demo: Shift_JIS on an A-profile stream.
    const sjis = new Uint8Array([0x82, 0xA0]); // Shift_JIS あ
    assert.equal(decodeShiftJIS(sjis), "あ");
    assert.equal(getDeclaredTextDecoder(Profile.TrProfileA, "Shift_JIS")(sjis), "あ");
    assert.equal(getDeclaredTextDecoder(Profile.TrProfileC, "EUC-JP")(new Uint8Array([0xA4, 0xA2])), "あ");
});

test("an unknown charset falls back to the profile, it does not fail", () => {
    assert.equal(getDeclaredTextDecoder(Profile.TrProfileA, "windows-1252")(new Uint8Array([0xA4, 0xA2])), "あ");
    assert.equal(decodeUTF8(bytes("plain")), "plain");
});
