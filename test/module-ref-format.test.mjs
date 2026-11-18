// The diagnostics pair a LockRecord with a ModuleLocked event by comparing this string exactly, so
// the format itself is load-bearing: a width or slash change silently stops the two records matching.
import test from "node:test";
import assert from "node:assert/strict";

import { formatModuleRef, formatModuleRefForLog } from "../dist/client/format.js";

test("a module reference is /cc/mmmm, zero padded", () => {
    assert.equal(formatModuleRef(0x40, 0x0000), "/40/0000");
    assert.equal(formatModuleRef(0x80, 0x1000), "/80/1000");
    assert.equal(formatModuleRef(0x7, 0x1), "/07/0001");
});

test("the log form is the same reference without the leading slash", () => {
    assert.equal(formatModuleRefForLog(0x40, 0x0000), "40/0000");
});

test("values wider than the pad keep all their digits", () => {
    // the pad is a minimum width, not a truncation
    assert.equal(formatModuleRef(0x100, 0x12345), "/100/12345");
});
