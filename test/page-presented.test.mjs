// 3.1.0: "loaded" and "on screen" are different facts, and conflating them blanked a host's screen.
// OpenDTV trusted `invisible:false` (what the document asked for, dispatched before the first frame
// is painted) while its window was not rendering, so a page that never reached the screen looked
// presented. The engine now reports the paint fact: `onNextFrame` only runs when a frame comes, the
// `presented` event is dispatched from it, `painted` records it, and `isPageVisible()` combines it
// with the document's own invisible state.
import test from "node:test";
import assert from "node:assert/strict";

import { onNextFrame } from "../dist/client/content.js";
import { BMLBrowser } from "../dist/client/bml_browser.js";

const withRaf = (raf, run) => {
    const had = "requestAnimationFrame" in globalThis;
    const original = globalThis.requestAnimationFrame;
    globalThis.requestAnimationFrame = raf;
    try {
        return run();
    } finally {
        if (had) {
            globalThis.requestAnimationFrame = original;
        } else {
            delete globalThis.requestAnimationFrame;
        }
    }
};

test("a rendering window runs the next frame, and says a frame will come", async () => {
    let ran = false;
    const scheduled = withRaf(
        (cb) => { setTimeout(() => cb(0), 1); return 1; },
        () => onNextFrame(() => { ran = true; }),
    );

    assert.equal(scheduled, true, "a frame was scheduled");
    assert.equal(ran, false, "the callback must not run synchronously");
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(ran, true, "the frame must run the callback");
});

test("a hidden window never runs it - that is why presented cannot fire there", async () => {
    let ran = false;
    const scheduled = withRaf(
        () => 0, // a throttled/occluded window: rAF is accepted and never calls back
        () => onNextFrame(() => { ran = true; }),
    );

    assert.equal(scheduled, true);
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(ran, false, "no frame, no callback - the presented event stays unsent");
});

test("a host with no requestAnimationFrame at all says so instead of pretending", () => {
    let ran = false;
    const scheduled = withRaf(undefined, () => onNextFrame(() => { ran = true; }));

    assert.equal(scheduled, false);
    assert.equal(ran, false);
});

test("isPageVisible is painted AND not declared invisible", () => {
    const visible = (painted, invisible) =>
        BMLBrowser.prototype.isPageVisible.call({ content: { painted, invisible } });

    assert.equal(visible(true, false), true, "painted and the page did not hide itself");
    assert.equal(visible(false, false), false, "loaded but never painted - the OpenDTV run B case");
    assert.equal(visible(true, true), false, "painted but the page asked to stay hidden");
    assert.equal(visible(false, undefined), false, "no body yet: nothing is on screen");
});
