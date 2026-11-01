// executeEventHandler promised "a handler that throws is contained to its own event" in its own doc
// comment, but the run and the attribute parse both threw. An arib-onload handler that threw
// aborted the document load and left diagnostics.phase at "running" for ever.
import test from "node:test";
import assert from "node:assert/strict";

import { EventQueue } from "../dist/client/event_queue.js";

const logger = {
    prefix: "",
    log() { },
    debug() { },
    info() { },
    warn() { },
    error() { },
};

function queueWith(runEventHandler) {
    const queue = new EventQueue({ runEventHandler }, logger);
    const failures = [];
    queue.onHandlerFailure = (kind, error) => failures.push([kind, error.message]);
    return { queue, failures };
}

test("a throwing handler returns false instead of rejecting", async () => {
    const { queue, failures } = queueWith(async () => {
        throw new Error("handler exploded");
    });

    assert.equal(await queue.executeEventHandler("startup()"), false);
    assert.deepEqual(failures, [["handler", "handler exploded"]], "the failure must be reported to the owner");
});

test("a malformed handler attribute is recorded, not thrown at the document load", async () => {
    const { queue, failures } = queueWith(async () => true);

    assert.equal(await queue.executeEventHandler("this is not a handler"), false);
    assert.equal(failures.length, 1);
    assert.equal(failures[0][0], "handler-attribute");
    assert.match(failures[0][1], /invalid event handler attribute/);
});

test("a successful handler still returns its result", async () => {
    const { queue, failures } = queueWith(async (name) => {
        assert.equal(name, "startup");
        return true;
    });

    assert.equal(await queue.executeEventHandler("startup()"), true);
    assert.deepEqual(failures, []);
});

test("an empty attribute is not a failure", async () => {
    const { queue, failures } = queueWith(async () => true);

    assert.equal(await queue.executeEventHandler("   "), false);
    assert.deepEqual(failures, []);
});
