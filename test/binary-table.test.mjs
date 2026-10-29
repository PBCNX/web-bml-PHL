// The binary-table codec is the NVRAM's only serializer, and every test it had fed it malformed
// structures. Issue #2 of the test_strategy review: no valid read, no round trip. This is the
// positive path — what a correct structure does.
import test from "node:test";
import assert from "node:assert/strict";

import { BinaryTable, parseBinaryStructure, readBinaryFields, writeBinaryFields } from "../dist/client/nvram/binary_table.js";

const decoder = new TextDecoder();
const encoder = new TextEncoder();
const decodeText = (bytes) => decoder.decode(bytes);
const encodeText = (text) => encoder.encode(text);

test("a valid structure parses into typed fields", () => {
    const fields = parseBinaryStructure("I:1B,I:2B,B:1b");

    assert.deepEqual(
        fields.map((f) => ({ type: f.type, unit: f.unit, length: f.length })),
        [
            { type: "I", unit: "B", length: 1 },
            { type: "I", unit: "B", length: 2 },
            { type: "B", unit: "b", length: 1 },
        ],
    );
});

test("integers round-trip through write and read", () => {
    const fields = parseBinaryStructure("I:1B,I:1B");

    const written = writeBinaryFields([7, 9], fields, encodeText);
    assert.deepEqual(Array.from(written), [7, 9]);
    assert.deepEqual(readBinaryFields(written, fields, decodeText)[0], [7, 9]);
});

test("a byte of packed flags round-trips as booleans", () => {
    const fields = parseBinaryStructure("B:1b,B:1b,B:1b,B:1b,B:1b,B:1b,B:1b,B:1b");
    const flags = [true, false, true, false, false, true, true, false];

    const written = writeBinaryFields(flags, fields, encodeText);
    assert.deepEqual(Array.from(written), [166], "10100110 packs to a single byte");
    assert.deepEqual(readBinaryFields(written, fields, decodeText)[0], flags);
});

test("a structure that does not end on a byte boundary is refused, not silently padded", () => {
    // 1 bit + 1 byte = 9 bits; the writer must not guess where the last byte ends
    const fields = parseBinaryStructure("B:1b,I:1B");

    assert.throws(() => writeBinaryFields([1, 5], fields, encodeText), /must begin on a byte boundary/);
});

test("constructBinaryTable reads a table (lengthByte 0) one row per field width", () => {
    const table = BinaryTable.constructBinaryTable(new Uint8Array([0x01, 0x02]), "0,I:1B", decodeText);

    assert.deepEqual(table.rows, [[1], [2]]);
    assert.equal(table.fields.length, 1);
});

test("constructBinaryTable honours a leading length byte", () => {
    // lengthByte = 1: each row carries a length byte, then the fields
    const table = BinaryTable.constructBinaryTable(new Uint8Array([0x02, 0x01, 0x05]), "1,I:2B", decodeText);

    assert.deepEqual(table.rows, [[261]]);
});
