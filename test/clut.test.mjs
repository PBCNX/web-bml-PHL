// readCLUT answered "I cannot read this" three different ways: it logged and carried on for a
// region-flagged CLUT (then read the wrong bytes), said "unexpected" for depth 3, and threw for
// start_end_flag 0 — while both call sites only fell back to the default for a *missing* file.
// A CLUT it cannot read now answers the default table and logs why.
import test from "node:test";
import assert from "node:assert/strict";

import { readCLUT } from "../dist/client/css/clut.js";
import { defaultCLUT } from "../dist/client/css/default_clut.js";

function readingLogger() {
    const lines = [];
    return {
        lines,
        logger: {
            prefix: "",
            log() { },
            debug() { },
            info() { },
            warn() { },
            error(...args) { lines.push(args.join(" ")); },
        },
    };
}

function read(bytes) {
    const { lines, logger } = readingLogger();
    const table = readCLUT(Uint8Array.from(bytes), logger);
    return { table, lines };
}

test("start_end_flag 0 answers the default table and says so", () => {
    const { table, lines } = read([0x00, 0x00]);

    assert.equal(table.length, defaultCLUT.length, "the same shape a missing CLUT gives");
    assert.deepEqual(table[0], [0, 0, 0, 255]);
    assert.match(lines.join(" "), /start_end_flag = 0 is not operated/);
});

test("a region-flagged CLUT answers the default table instead of misreading bytes", () => {
    const { table, lines } = read([0x18, 0, 0, 0, 0, 0, 0, 0, 0]);

    assert.equal(table.length, defaultCLUT.length, "the same shape a missing CLUT gives");
    assert.match(lines.join(" "), /region is not operated/);
});

test("an unoperated depth answers the default table", () => {
    const { table, lines } = read([0x68, 0x00, 0x00]);

    assert.equal(table.length, defaultCLUT.length, "the same shape a missing CLUT gives");
    assert.match(lines.join(" "), /unexpected clut depth/);
});

test("a readable CLUT still decodes its entries", () => {
    // depth 0, start_end_flag 1, one entry from 0 to 1: white (Y=235) then black (Y=16)
    const { table, lines } = read([0x08, 0x01, 235, 128, 128, 255, 16, 128, 128, 255]);

    assert.deepEqual(table[0], [254, 254, 254, 255], "Y=235 is near-white after the CbCr conversion");
    assert.deepEqual(table[1], [0, 0, 0, 255], "Y=16 is black");
    assert.deepEqual(lines, [], "a readable CLUT must not log an error");
});
test("a CLUT that ends mid-entry answers the default instead of NaN colours", () => {
    // Without a bounds check the table filled with NaN, which renders as #NaNNaNNaNNaN.
    const { table, lines } = read([0x08, 0x03, 235, 128, 128, 255]);

    assert.equal(table.length, defaultCLUT.length);
    assert.equal(table.filter((e) => e.some((v) => Number.isNaN(v))).length, 0);
    assert.match(lines.join(" "), /clut ends mid-entry/);
});