// The introspection collector is the "why is this page stuck?" seam: it records the document phase,
// every module lock (and whether its ModuleLocked bevent ever followed), every table read outcome and
// every script error. Nothing in the engine reads it back, so nothing else tests it — which is
// exactly why it needs a test of its own.
import test from "node:test";
import assert from "node:assert/strict";

import { Diagnostics } from "../dist/client/introspection.js";

test("the document phase is recorded with its detail", () => {
    const diagnostics = new Diagnostics();

    diagnostics.setPhase(1, "fetching", null, "40/0000/tptop.bml");
    let phase = diagnostics.describePhase();
    assert.equal(phase.phase, "fetching");
    assert.equal(phase.document, null);
    assert.equal(phase.requested, "40/0000/tptop.bml");

    diagnostics.setPhase(1, "ready", "40/0000/tptop.bml", "40/0000/tptop.bml");
    phase = diagnostics.describePhase();
    assert.equal(phase.phase, "ready");
    assert.equal(phase.document, "40/0000/tptop.bml");
});

test("a lock records the value the page got and whether its bevent followed", () => {
    const diagnostics = new Diagnostics();

    const record = diagnostics.lock("lockModuleOnMemory", "/40/0000", "/40/0000", 1, "deferred");
    assert.equal(record.returned, 1);
    assert.equal(record.outcome, "deferred");

    // no ModuleLocked bevent yet: this is the "page waits forever" shape the snapshot must show
    let locks = diagnostics.describeLocks();
    assert.equal(locks.length, 1);
    assert.equal(locks[0].moduleLockedEvent, null);

    diagnostics.moduleLockedEvent("/40/0000", false, 0);
    locks = diagnostics.describeLocks();
    // the field is the status the ModuleLocked bevent carried, not a record
    assert.equal(locks[0].moduleLockedEvent, 0);
});

test("a table read carries its outcome and failure reason", () => {
    const diagnostics = new Diagnostics();

    diagnostics.table("table[bml://x/0]", "/40/0000/x", "0,I:2B", "found", { rows: 2, bytes: 4 });
    diagnostics.table("table[bml://y/0]", "/40/0000/y", "0,I:2B", "not-found");

    const tables = diagnostics.describeTables();
    assert.equal(tables.length, 2);
    assert.equal(tables[0].outcome, "found");
    assert.equal(tables[0].rows, 2);
    assert.equal(tables[1].outcome, "not-found");
});

test("a script error keeps its phase, script name and message", () => {
    const diagnostics = new Diagnostics();

    diagnostics.scriptError("parse", "40/0000/inline[0]", new SyntaxError("unexpected token"));
    diagnostics.scriptError("run", undefined, new Error("boom"));

    const errors = diagnostics.describeScripts();
    assert.equal(errors.length, 2);
    assert.equal(errors[0].phase, "parse");
    assert.equal(errors[0].script, "40/0000/inline[0]");
    assert.match(errors[0].message, /unexpected token/);
    assert.equal(errors[1].phase, "run");
    assert.equal(errors[1].script, null);
});

test("described records are copies, not the live buffers", () => {
    const diagnostics = new Diagnostics();
    diagnostics.event("click", "/40/0000/x", null);

    const events = diagnostics.describeEvents();
    events[0].type = "mutated";

    assert.equal(diagnostics.describeEvents()[0].type, "click");
});
