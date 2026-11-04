// getProgramInfoAsync used to be a promise that could only settle if a program arrived; a page
// transition left the waiters pending forever. Exiting the document now settles them with null.
import test from "node:test";
import assert from "node:assert/strict";

import { Resources } from "../dist/client/resource.js";

const logger = {
    prefix: "",
    log() { },
    debug() { },
    info() { },
    warn() { },
    error() { },
};

function makeResources() {
    return new Resources(undefined, {}, logger);
}

test("a waiter is settled with null when the document exits", async () => {
    const resources = makeResources();
    const pending = resources.getProgramInfoAsync();

    resources.abandonPendingProgramInfo("document exited");

    assert.equal(await pending, null);
});

test("abandoning with no waiters is a no-op", () => {
    const resources = makeResources();

    assert.doesNotThrow(() => resources.abandonPendingProgramInfo("document exited"));
});

test("an already known program resolves immediately", async () => {
    const resources = makeResources();
    resources.currentProgramInfo = { type: "programInfo" };

    assert.equal(await resources.getProgramInfoAsync(), resources.currentProgramInfo);
});
