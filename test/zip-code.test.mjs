// The zip-code codec's failures used to be predicate dumps with no data in them — "a === 0xf || b
// === 0xf ... 5digit range" tells a reader which expression tripped and nothing about the entry.
import test from "node:test";
import assert from "node:assert/strict";

import { decodeZipCode } from "../dist/client/nvram/zip_code.js";

// [length, excludeListLength, ...entries]
const bytes = (...data) => Uint8Array.from(data);

function failure(...data) {
    try {
        decodeZipCode(bytes(...data));
    } catch (e) {
        return e.message;
    }
    return null;
}

test("a reserved digit in a 3-digit list says which digit and where", () => {
    const message = failure(3, 0, 0x81, 0x8a, 0xff);

    assert.notEqual(message, null, "the entry should be refused");
    assert.match(message, /a 3-digit list digit must be 0-9/);
    assert.match(message, /entry at byte 0/, "the failing entry's offset must be reported");
    assert.match(message, /flag=0x8/, "the entry kind must be reported");
    assert.match(message, /a=10/, "the decoded digit must be reported");
});

test("a 3-digit range without the reserved first digit names the rule", () => {
    const message = failure(3, 0, 0x81, 0x91, 0x23);

    assert.match(message, /a 3-digit range must set its first digit to F/);
    assert.match(message, /entry at byte 0/);
});

test("a range end with no preceding start reports both flags", () => {
    const message = failure(3, 0, 0x81, 0xc1, 0x23);

    assert.match(message, /must follow a range start/);
    assert.match(message, /not flag 0x0/, "the previous entry's flag is the useful fact here");
});

test("a well-formed 3-digit list still decodes", () => {
    const { list } = decodeZipCode(bytes(3, 0, 0x81, 0x81, 0xff));

    assert.notEqual(list.length, 0, "a valid list must produce ranges");
});

test("no zip-code failure is a bare predicate dump", () => {
    for (const data of [[3, 0, 0x81, 0x8a, 0xff], [3, 0, 0x81, 0x91, 0x23], [3, 0, 0x81, 0xc1, 0x23]]) {
        const message = failure(...data);
        assert.doesNotMatch(message, /^(a|b|c|d|e|prevFlag) [!=]==/, "predicate dump returned");
        assert.match(message, /entry at byte \d+/);
    }
});
