// 2.4.4: loadDocument awaits a requestAnimationFrame between unload and parse. A hidden/occluded
// window throttles or stops rAF, and with no floor the load never settles — BMLPLAYER saw startup.bml
// "still loading" at 190 s with every module already in. The timer is the floor.
import test from "node:test";
import assert from "node:assert/strict";

import { requestAnimationFrameAsync } from "../dist/client/content.js";

test("a stopped requestAnimationFrame does not hold the load", async () => {
    const originalRaf = globalThis.requestAnimationFrame;
    const originalSetTimeout = globalThis.setTimeout;
    try {
        // a window that never paints: rAF is a no-op
        globalThis.requestAnimationFrame = () => 0;
        const started = Date.now();
        await requestAnimationFrameAsync(30);
        const elapsed = Date.now() - started;
        assert.ok(elapsed >= 25, `settled before the floor: ${elapsed} ms`);
        assert.ok(elapsed < 1000, `settled too late: ${elapsed} ms`);
    } finally {
        globalThis.requestAnimationFrame = originalRaf;
        globalThis.setTimeout = originalSetTimeout;
    }
});

test("a painting window still settles on the frame", async () => {
    const originalRaf = globalThis.requestAnimationFrame;
    try {
        globalThis.requestAnimationFrame = (cb) => { setTimeout(() => cb(0), 1); return 1; };
        const started = Date.now();
        await requestAnimationFrameAsync(500);
        assert.ok(Date.now() - started < 200, "the frame path should win over the floor");
    } finally {
        globalThis.requestAnimationFrame = originalRaf;
    }
});
