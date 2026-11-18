// --used-key-list is a space-separated list of key-group names. Two call sites used to hand-write
// the same whitelist, and both omitted "other-tuning" — so a page that named it had the group
// dropped from the usedkeylistchanged event while the key gate still honoured it.
import test from "node:test";
import assert from "node:assert/strict";

import { parseUsedKeyList } from "../dist/client/format.js";

test("the declared groups are parsed in order", () => {
    assert.deepEqual([...parseUsedKeyList("basic data-button")], ["basic", "data-button"]);
});

test("all six declared key groups survive", () => {
    const groups = parseUsedKeyList("basic data-button numeric-tuning other-tuning special-1 special-2");
    assert.equal(groups.size, 6);
    assert.ok(groups.has("other-tuning"), "other-tuning was previously dropped by both call sites");
});

test("unknown tokens are dropped and empty input yields nothing", () => {
    assert.deepEqual([...parseUsedKeyList("basic nonsense data-button")], ["basic", "data-button"]);
    assert.equal(parseUsedKeyList("").size, 0);
    assert.equal(parseUsedKeyList("   ").size, 0);
});
