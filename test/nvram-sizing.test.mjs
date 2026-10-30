import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { areaBytesFor, phAreaSizing, SIZED_AREA_PREFIXES } from "../dist/client/nvram/nvram_sizing.js";

// C15: the standard's NVRAM page (read as "A-profile memory area for the affiliation ... 4 KB for one
// Affiliation; A-profile memory area ... 4 KB for one broadcaster") sizes the affiliation and
// broadcaster areas at 4 KB. The engine's base table is the Japanese 64 bytes; a PH host opts into
// 4096. The other areas must not move.

test("a PH host can size the affiliation and broadcaster areas at the standard's 4 KB", () => {
    assert.deepEqual(phAreaSizing(), { areaBytes: 4096 });
    for (const prefix of SIZED_AREA_PREFIXES) {
        assert.equal(areaBytesFor(prefix, phAreaSizing(), 64), 4096, `${prefix} is not 4 KB`);
    }
    // The remaining areas keep the table's size.
    assert.equal(areaBytesFor("Cprogroup", phAreaSizing(), 64), 64);
    assert.equal(areaBytesFor("common", phAreaSizing(), 64), 64);
});

test("the areas can be sized one at a time, and the default keeps 64 bytes", () => {
    assert.equal(areaBytesFor("group", { affiliationBytes: 8192 }, 64), 8192);
    assert.equal(areaBytesFor("local", { affiliationBytes: 8192 }, 64), 64, "the broadcaster area is untouched");
    assert.equal(areaBytesFor("local", { broadcasterBytes: 8192 }, 64), 8192);
    assert.equal(areaBytesFor("group", {}, 64), 64, "no sizing means the table's own size");
    assert.equal(areaBytesFor("group", { areaBytes: 4096, affiliationBytes: 2048 }, 64), 2048, "the specific wins");
});

test("the NVRAM class applies the sizing to the area it resolves", () => {
    // The wiring check: findNvramArea must return the sized copy, not the table row.
    // Path-based, so a rename fails this test even when behaviour is unchanged (it did, when the
    // file moved to client/nvram/). Kept because the sizing is not observable through the public API;
    // see test/nvram-permissions.test.mjs for the behavioural coverage.
    const source = readFileSync(join(import.meta.dirname, "..", "client", "nvram", "nvram.ts"), "utf8");
    assert.match(source, /areaBytesFor\(area\.prefix, this\.sizing, area\.size\)/, "nvram.ts no longer applies the sizing");
    const browser = readFileSync(join(import.meta.dirname, "..", "client", "bml_browser.ts"), "utf8");
    assert.match(browser, /areaBytes: options\.nvramAreaBytes/, "the option is not passed to the NVRAM");
});
