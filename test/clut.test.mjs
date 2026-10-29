import test from "node:test";
import assert from "node:assert/strict";

import { readCLUT } from "../dist/client/clut.js";
import { defaultCLUT } from "../dist/client/default_clut.js";

// The QC pass found readCLUT answering "I cannot read this" three different ways — log-and-carry-on,
// "unexpected", and a throw — while both callers only fell back to the default for a *missing* file.
// The throwing cases escaped into the page's <object> data path. Every unreadable shape now answers
// the default 256-entry table and logs why.

function logger() {
    const calls = [];
    return { prefix: "t:", calls, error: (...args) => calls.push(args), log: () => {}, warn: () => {}, debug: () => {}, info: () => {} };
}

const BLACK = [0, 0, 0, 255];

test("a readable depth-0 CLUT decodes its entries", () => {
    // depth 0, start_end_flag set, no region: start 0, end 2, then (Y, Cb, Cr, A) per entry.
    const clut = Uint8Array.from([
        0x08, 0x02,
        235, 128, 128, 255,   // near-white
        16, 128, 128, 255,    // black
        128, 128, 128, 255,   // mid grey
    ]);
    const log = logger();
    const table = readCLUT(clut, log);
    assert.equal(table.length, 256);
    assert.equal(log.calls.length, 0, "a readable CLUT must not log");
    assert.ok(table[0][0] >= 250, "Y=235 should be near-white");
    assert.equal(table[1][0], 0, "Y=16 should be black");
});

test("an unreadable shape answers the default table instead of throwing", () => {
    for (const [name, clut] of [
        ["region_flag", [0x18, 0, 0, 0, 0, 0, 0, 0, 0]],
        ["depth 3", [0x68, 0x00]],
        ["start_end_flag 0", [0x00]],
    ]) {
        const log = logger();
        const table = readCLUT(Uint8Array.from(clut), log);
        assert.equal(table.length, 256, `${name}: 256 entries`);
        assert.equal(log.calls.length, 1, `${name}: the reason is logged`);
        // Past the shipped default entries the table is opaque black.
        assert.deepEqual(table[255], BLACK, `${name}: default fill`);
        // The region case used to log and then decode from shifted offsets, overwriting entries;
        // the whole table must be the default one.
        assert.deepEqual(table[0], defaultCLUT[0], `${name}: the first entry is the default`);
    }
});
