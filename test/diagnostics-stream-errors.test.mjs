// The stream's own error channel is invisible to the page, so it must reach the diagnostics
// snapshot; otherwise getDiagnostics reports a healthy page while the broadcaster reported a fault.
import test from "node:test";
import assert from "node:assert/strict";

import { Diagnostics } from "../dist/client/introspection.js";

test("a stream error is recorded and described", () => {
    const diagnostics = new Diagnostics();

    assert.deepEqual(diagnostics.describeStreamErrors(), []);

    diagnostics.streamError("transport stream lost");

    const errors = diagnostics.describeStreamErrors();
    assert.equal(errors.length, 1);
    assert.equal(errors[0].message, "transport stream lost");
    assert.equal(typeof errors[0].at, "number");
});

test("the stream error buffer is bounded", () => {
    const diagnostics = new Diagnostics();
    for (let i = 0; i < 50; i++) {
        diagnostics.streamError(`error ${i}`);
    }

    const errors = diagnostics.describeStreamErrors();
    assert.ok(errors.length <= 16, `expected a bounded buffer, got ${errors.length}`);
    assert.equal(errors[errors.length - 1].message, "error 49");
});
