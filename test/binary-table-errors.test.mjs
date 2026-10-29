// The demuxer turns a table-read failure into diagnostics' TableRecord.error, documented as "why it
// failed". Those messages used to be the literal "FIXME", which told a host nothing.
import test from "node:test";
import assert from "node:assert/strict";

import { BinaryTable, parseBinaryStructure, readBinaryFields } from "../dist/client/nvram/binary_table.js";

const decoder = new TextDecoder();
const data = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

function failure(structure) {
    try {
        BinaryTable.constructBinaryTable(data, structure, (bytes) => decoder.decode(bytes));
    } catch (e) {
        return e.message;
    }
    return null;
}

test("a structure without a field list says so", () => {
    assert.match(failure("nonsense"), /binary table: a structure must be/);
});

test("a non-decimal leading length says so", () => {
    assert.match(failure("x,"), /leading length is not a decimal octet count/);
});

test("an unparsable field list names the structure", () => {
    assert.match(failure("0,B:8"), /field list after the comma could not be parsed: "0,B:8"/);
});

test("a boolean field in bytes names the field and the rule", () => {
    const message = failure("0,B:1B");
    assert.match(message, /a boolean field must be measured in bits/);
    assert.match(message, /type=B, unit=B, length=1/, "the message must identify the offending field");
});

test("no failure message is a placeholder", () => {
    for (const structure of ["nonsense", "x,", "0,B:8", "0,B:1B"]) {
        assert.doesNotMatch(failure(structure), /FIXME/i, `${structure} still reports a placeholder`);
    }
});
test("every field-kind failure names the field and the rule, not just booleans", () => {
    // The Boolean branch was the only one pinned; the other five kinds said "must be byte" with no
    // type, unit or length, and those strings are what DiagnosticsSnapshot.table records.
    const cases = [
        ["I:1b", /a numeric field must be measured in bytes/, /type=I, unit=b, length=1/],
        ["S:1b", /a string field must be measured in bytes or be variable-length/, /type=S, unit=b/],
        ["Z:1B", /a zip-code field must be variable-length/, /type=Z, unit=B/],
    ];
    for (const [structure, rule, field] of cases) {
        const fields = parseBinaryStructure(structure);
        const message = (() => {
            try {
                readBinaryFields(data, fields, (bytes) => decoder.decode(bytes));
            } catch (e) {
                return e.message;
            }
            return null;
        })();
        assert.notEqual(message, null, `${structure} did not fail`);
        assert.match(message, rule, structure);
        assert.match(message, field, structure);
        assert.doesNotMatch(message, /FIXME/, structure);
    }
});