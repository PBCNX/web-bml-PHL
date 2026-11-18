// 3.1.1: a key whose UP was lost used to block every later key, silently, for the rest of the
// document's life — `processKeyDown` returned while a status was set, and `processKeyUp` only cleared
// it for the same code. A page change (which resets the event queue) or a dropped release produced it,
// and the host could not tell "held" from "lost". The arbitration is pure, so the trap is pinned here
// rather than in a device run.
import test from "node:test";
import assert from "node:assert/strict";

import { arbitrateKeyDown, arbitrateKeyUp } from "../dist/client/content.js";

const held = (keyCode, startedAt = 1000) => ({ keyCode, isAccessKey: false, startedAt });

test("nothing held: the press is taken as-is", () => {
    assert.deepEqual(arbitrateKeyDown(undefined, 22, 2000), { replaced: "none", ageMs: 0, heldKeyCode: null });
});

test("the same key pressed again with no UP: a re-press, not a drop", () => {
    const verdict = arbitrateKeyDown(held(22), 22, 1500);

    assert.equal(verdict.replaced, "re-press");
    assert.equal(verdict.ageMs, 500);
});

test("another key while one is down: the held UP was lost, and the log can name it", () => {
    const verdict = arbitrateKeyDown(held(22), 24, 1300);

    assert.equal(verdict.replaced, "lost-up");
    assert.equal(verdict.ageMs, 300);
    assert.equal(verdict.heldKeyCode, 22);
});

test("a clock that went backwards still reports a sane age", () => {
    assert.equal(arbitrateKeyDown(held(22, 5000), 22, 4000).ageMs, 0);
});

test("the matching UP releases the key", () => {
    assert.equal(arbitrateKeyUp(held(23), 23), "release");
});

test("an UP for another key clears the held one instead of leaving it set", () => {
    assert.equal(arbitrateKeyUp(held(23), 22), "release-mismatch");
});

test("an UP with nothing held does nothing", () => {
    assert.equal(arbitrateKeyUp(undefined, 22), "nothing");
});
