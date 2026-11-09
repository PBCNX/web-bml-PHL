// ISDB-Tb 8-bit Latin text in a designated field (TV Peru capture, 2026-11-10).
//
// The stream writes its superimpose/caption text as ISO-8859-1 in a designated alphanumeric field:
// "Alerta de inundación. Área de prueba AAA." with F3 = ó, C1 = Á, ED = í. ARIB has no alphanumeric
// byte in 0x80–0xFF, so in the Philippine reading (auto) the byte is its Latin-1 code point. The
// strict reading (arib) keeps the old behaviour: the field is not decodable here and falls back.
import test from "node:test";
import assert from "node:assert/strict";
import { decodeARIBText } from "../dist/client/media/arib_text.js";
import { decodeEUCJP } from "../dist/client/charset/euc_jp.js";

const ascii = (s) => Uint8Array.from([...s].map((c) => c.charCodeAt(0)));
const concat = (...parts) => {
    const out = [];
    for (const part of parts) out.push(...(typeof part === "string" ? ascii(part) : part));
    return new Uint8Array(out);
};

test("ISDB-Tb: ISO-8859-1 bytes in a designated alnum field read as Latin-1", () => {
    // 1B 28 4A (G0 <- Alphanumeric), then the measured text with its 8-bit letters.
    const field = concat(b_esc_g0_alnum(), "Alerta de inundaci", [0xf3], "n. ", [0xc1], "rea de prueba AAA.");
    assert.equal(decodeARIBText(field, decodeEUCJP), "Alerta de inundación. Área de prueba AAA.");
});

test("ISDB-Tb: LS1 into the default alnum G1 reads the same bytes as Latin-1", () => {
    // 0E (LS1) then "Señal Área": ñ = F1, Á = C1.
    const field = concat([0x0e], "Se", [0xf1], "al ", [0xc1], "rea");
    assert.equal(decodeARIBText(field, decodeEUCJP), "Señal Área");
});

test("the strict reading keeps the old fallback, so a Japanese host can opt out", () => {
    const field = concat(b_esc_g0_alnum(), "Alerta ", [0xf3]);
    assert.equal(decodeARIBText(field, decodeEUCJP, "arib"), decodeEUCJP(field));
    assert.notEqual(decodeARIBText(field, decodeEUCJP, "arib"), "Alerta ó");
});

test("a Japanese designated field with high bytes is not claimed", () => {
    // 1B 29 42 (G1 <- Kanji), then GR bytes: the active set is kanji, so the field falls back whole.
    const kanjiG1 = concat([0x1b, 0x29, 0x42, 0xb1, 0xb2]);
    assert.equal(decodeARIBText(kanjiG1, decodeEUCJP), decodeEUCJP(kanjiG1));
    // G0 <- Kanji then 8-bit bytes: same rule.
    const kanjiG0 = concat([0x1b, 0x28, 0x42, 0xa4, 0xa2]);
    assert.equal(decodeARIBText(kanjiG0, decodeEUCJP), decodeEUCJP(kanjiG0));
});

function b_esc_g0_alnum() {
    return [0x1b, 0x28, 0x4a];
}
