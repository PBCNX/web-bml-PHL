"use strict";
/**
 * P1 — the introspection seam.
 *
 * A host-visible view of what a page is *waiting on*. Both of our worst investigation days were
 * invisible-state problems: `40/1000/tptop.bml` sitting on 読み込み中 forever while 76 modules of
 * TBS data went by, and a yellow label that turned out to be the page's own fallback because a
 * table read returned nothing. Neither is a rendering fault, and neither was visible from outside:
 * the page was drawn, the log said nothing, and the host could only ask "what is on screen?".
 *
 * This records the four things that answer "why is this page stuck?":
 *
 *   1. the document lifecycle — requested, fetching, parsing, running, ready, failed, exited
 *   2. every module lock and unlock, with the value the page got back *and* whether the
 *      ModuleLocked bevent that follows it was ever dispatched
 *   3. every table read, with its outcome (found / not found / unparseable)
 *   4. every script error, parse and run time
 *
 * It is strictly read-only: nothing here changes a code path, a DOM node, a style or a draw. The
 * only cost is a push to a ring buffer, and the buffers are bounded, so a page that loops cannot
 * grow it. Anything a host can see here, a receiver could also know — this is observation, not
 * behaviour.
 *
 * `BMLBrowser#getDiagnostics()` assembles a plain-JSON snapshot (NaN becomes null, so it survives
 * `JSON.stringify` and a pipe). Nothing in the engine reads it back.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Diagnostics = void 0;
const LOCK_LIMIT = 64;
const TABLE_LIMIT = 64;
const SCRIPT_LIMIT = 32;
const BEVENT_LIMIT = 64;
const STREAM_ERROR_LIMIT = 16;
function pushBounded(list, item, limit) {
    list.push(item);
    if (list.length > limit) {
        list.splice(0, list.length - limit);
    }
}
function finite(value) {
    return Number.isFinite(value) ? value : null;
}
function describeError(e) {
    if (e == null) {
        return "null";
    }
    if (typeof e === "object") {
        const anyError = e;
        const name = typeof anyError.name === "string" ? anyError.name : null;
        const message = typeof anyError.message === "string" ? anyError.message : null;
        if (name != null || message != null) {
            return [name, message].filter(x => x != null).join(": ");
        }
        try {
            return JSON.stringify(e);
        }
        catch {
            return String(e);
        }
    }
    return String(e);
}
class Diagnostics {
    locks = [];
    tables = [];
    scripts = [];
    streamErrors = [];
    bevents = [];
    seq = 0;
    phase = {
        phase: "idle",
        document: null,
        requested: null,
        since: 0,
        detail: null,
    };
    /** bumped by the owner so a stale asynchronous write cannot overwrite a newer phase */
    phaseToken = 0;
    resolution = null;
    next() {
        return ++this.seq;
    }
    setPhase(token, phase, document, requested, detail = null) {
        if (token < this.phaseToken) {
            return;
        }
        this.phaseToken = token;
        this.phase = { phase, document, requested, since: performance.now(), detail };
    }
    get phaseTokenNow() {
        return this.phaseToken;
    }
    setResolution(declared, width, height, displayAspectRatio) {
        this.resolution = { declared, width, height, displayAspectRatio };
    }
    lock(api, module, normalized, returned, outcome) {
        const record = {
            seq: this.next(),
            at: performance.now(),
            api,
            module,
            normalized,
            returned: finite(returned),
            outcome,
            settledAt: null,
            settledAs: null,
            moduleLockedEvent: null,
        };
        pushBounded(this.locks, record, LOCK_LIMIT);
        return record;
    }
    /** The deferred half of a lock: the carousel answered, or the request was cancelled. */
    settleLock(record, outcome) {
        if (record == null) {
            return;
        }
        record.settledAt = performance.now();
        record.settledAs = outcome;
        if (record.outcome === "requested" && outcome !== "locked") {
            record.outcome = "failed-after-request";
        }
    }
    /**
     * A ModuleLocked bevent was dispatched. Attach it to the most recent lock for that module that
     * has not got one yet — that pairing is the whole point: the page waits for the *event*, not
     * for the return value, and a lock that returns 1 without an event is a page stuck on
     * 読み込み中.
     */
    moduleLockedEvent(module, isEx, status) {
        for (let i = this.locks.length - 1; i >= 0; i--) {
            const record = this.locks[i];
            if (record.moduleLockedEvent == null && record.normalized === module &&
                (record.api === "lockModuleOnMemory" || record.api === "lockModuleOnMemoryEx") &&
                (record.api === "lockModuleOnMemoryEx") === isEx) {
                record.moduleLockedEvent = status;
                return;
            }
        }
    }
    table(request, normalized, structure, outcome, extra = {}) {
        const record = {
            seq: this.next(),
            at: performance.now(),
            request,
            normalized,
            structure,
            outcome,
            rows: extra.rows ?? null,
            columns: extra.columns ?? null,
            bytes: extra.bytes ?? null,
            error: extra.error ?? null,
        };
        pushBounded(this.tables, record, TABLE_LIMIT);
        return record;
    }
    scriptError(phase, script, error) {
        pushBounded(this.scripts, {
            seq: this.next(),
            at: performance.now(),
            phase,
            script: script ?? null,
            message: describeError(error),
        }, SCRIPT_LIMIT);
    }
    /**
     * A message from the stream's own error channel. The page can look perfectly healthy while the
     * broadcaster has reported a failure, so it is recorded here instead of only being logged.
     */
    streamError(message) {
        pushBounded(this.streamErrors, {
            seq: this.next(),
            at: performance.now(),
            message,
        }, STREAM_ERROR_LIMIT);
    }
    describeStreamErrors() {
        return this.streamErrors.map(x => ({ ...x }));
    }
    event(type, target, status) {
        pushBounded(this.bevents, {
            seq: this.next(),
            at: performance.now(),
            type,
            target,
            status,
        }, BEVENT_LIMIT);
    }
    describeLocks() {
        return this.locks.map(x => ({ ...x }));
    }
    describeTables() {
        return this.tables.map(x => ({ ...x }));
    }
    describeScripts() {
        return this.scripts.map(x => ({ ...x }));
    }
    describeEvents() {
        return this.bevents.map(x => ({ ...x }));
    }
    describePhase() {
        return { ...this.phase, ageMs: performance.now() - this.phase.since };
    }
    describeResolution() {
        return this.resolution == null ? null : { ...this.resolution };
    }
    /** How many events of a type reached a beitem — used to answer "is this subscription dead?". */
    countEvents(type, target) {
        let n = 0;
        for (const record of this.bevents) {
            if (record.type !== type) {
                continue;
            }
            if (target == null || record.target === target) {
                n++;
            }
        }
        return n;
    }
    lastEventAt(type, target) {
        for (let i = this.bevents.length - 1; i >= 0; i--) {
            const record = this.bevents[i];
            if (record.type === type && (target == null || record.target === target)) {
                return record.at;
            }
        }
        return null;
    }
}
exports.Diagnostics = Diagnostics;
//# sourceMappingURL=introspection.js.map