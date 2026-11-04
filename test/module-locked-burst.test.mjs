// 2.4.5: a page that re-locks a module whenever the status is not 0 (ABS's onLkDMdl does exactly
// that) turns one failing lock into an endless ModuleLocked stream when the engine keeps answering
// with the same failure — /50/3001 is not in the ABS DII, so the answer is -2 every time. The burst is
// capped, so the page cannot starve the timers.
import test from "node:test";
import assert from "node:assert/strict";

import { EventDispatcher, MODULE_LOCKED_BURST_LIMIT } from "../dist/client/event_queue.js";

function dispatcher() {
    // the limiter reads only its own map; the rest of the dispatcher is never touched
    const d = Object.create(EventDispatcher.prototype);
    d.moduleLockedStorm = new Map();
    return d;
}

test("a ModuleLocked burst is capped per second, then allowed again", () => {
    const d = dispatcher();
    let allowed = 0;
    for (let i = 0; i < MODULE_LOCKED_BURST_LIMIT + 8; i++) {
        if (d.allowedModuleLockedEvent("/50/3001", -2, 1000)) {
            allowed++;
        }
    }
    assert.equal(allowed, MODULE_LOCKED_BURST_LIMIT, "the burst must stop at the limit");
    assert.equal(d.allowedModuleLockedEvent("/50/3001", -2, 2101), true, "a new second is a new budget");
});

test("different modules and statuses have separate budgets", () => {
    const d = dispatcher();
    for (let i = 0; i < MODULE_LOCKED_BURST_LIMIT; i++) {
        d.allowedModuleLockedEvent("/50/3001", -2, 1000);
    }
    assert.equal(d.allowedModuleLockedEvent("/50/3001", -2, 1000), false);
    assert.equal(d.allowedModuleLockedEvent("/50/1001", -2, 1000), true);
    assert.equal(d.allowedModuleLockedEvent("/50/3001", 0, 1000), true);
});
