// The queue is driven from twelve fire-and-forget call sites, so its promise must settle rather
// than reject: a throwing handler is contained to its own event and the queue keeps draining.
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

const interpreter = {
    reset() { },
    addScript: async () => false,
    runEventHandler: async () => false,
    resetStack() { },
    isExecuting: false,
    setupEnvironment() { },
};

function makeQueue() {
    return new EventQueue(interpreter, logger);
}

function dispatcher(overrides) {
    return {
        dispatchFocus: async () => false,
        dispatchBlur: async () => false,
        dispatchClick: async () => false,
        dispatchChange: async () => false,
        ...overrides,
    };
}

test("a throwing handler is contained: the queue settles false instead of rejecting", async () => {
    const queue = makeQueue();
    queue.attachDispatcher(dispatcher({
        dispatchClick: async () => {
            throw new Error("handler blew up");
        },
    }));
    queue.queueSyncEvent({ type: "click", target: {} });

    assert.equal(await queue.processEventQueue(), false);
});

test("dispatching before a dispatcher is attached is contained, not thrown", async () => {
    const queue = makeQueue();
    queue.queueSyncEvent({ type: "click", target: {} });

    assert.equal(await queue.processEventQueue(), false);
});

test("a handler that reports exit stops the queue and processEventQueue resolves true", async () => {
    const queue = makeQueue();
    queue.attachDispatcher(dispatcher({ dispatchClick: async () => true }));
    queue.queueSyncEvent({ type: "click", target: {} });

    assert.equal(await queue.processEventQueue(), true);
});

test("a discarded queue runs nothing", async () => {
    const queue = makeQueue();
    let dispatched = false;
    queue.attachDispatcher(dispatcher({
        dispatchClick: async () => {
            dispatched = true;
            return false;
        },
    }));
    queue.queueSyncEvent({ type: "click", target: {} });
    queue.discard();

    assert.equal(await queue.processEventQueue(), false);
    assert.equal(dispatched, false);
});
