// Module references, at the shape PH pages actually use them.
//
// P3 ("locking parity") was recorded as owed on the premise that the Ex lock path was missing. It is
// not: `lockModuleOnMemoryEx` is upstream code, and ABS-CBN's own page drives it with
// `browser.lockModuleOnMemoryEx("/60/1" + sGN)` where sGN is a three-character group code, i.e.
// "/60/1000". This test pins the parsing that premise depends on, because a ref the engine cannot
// parse is the one way a working Ex path would still fail a real page.
//
// Resources is constructible outside a browser (no DOM in its constructor), which is why this can be
// a unit test rather than a renderer run.
import test from "node:test";
import assert from "node:assert/strict";
import { Resources } from "../dist/client/resource.js";
import { Logger } from "../dist/client/util/logger.js";

const resources = new Resources(undefined, {}, new Logger("[test] "));

test("the reference ABS-CBN's Ex lock builds parses as component 0x60, module 0x1000", () => {
    // "/60/1" + sGN, sGN = "000" — the default group code before the receiver's own is read.
    assert.deepEqual(resources.parseURLEx("/60/1000"), { componentId: 0x60, moduleId: 0x1000, filename: null });
});

test("a single-hex-digit module suffix is still hex, not decimal", () => {
    assert.deepEqual(resources.parseURLEx("/60/1A"), { componentId: 0x60, moduleId: 0x1a, filename: null });
    assert.deepEqual(resources.parseURLEx("/60/19"), { componentId: 0x60, moduleId: 0x19, filename: null });
});

test("a module with a filename keeps it, and the document refs PH pages use parse", () => {
    assert.deepEqual(resources.parseURLEx("/40/0001/textdata4.btb"), { componentId: 0x40, moduleId: 1, filename: "textdata4.btb" });
    // The refs P7/P2 were measured against: ABS's textdata4 and GMA's rss_data5.
    assert.deepEqual(resources.parseURLEx("/50/1001/textdata4.btb"), { componentId: 0x50, moduleId: 0x1001, filename: "textdata4.btb" });
    assert.deepEqual(resources.parseURLEx("/50/1015/rss_data5.btb"), { componentId: 0x50, moduleId: 0x1015, filename: "rss_data5.btb" });
});

test("an unparseable reference yields nulls rather than throwing", () => {
    const parsed = resources.parseURLEx("not a ref");
    assert.equal(parsed.componentId, null);
    assert.equal(parsed.moduleId, null);
});
