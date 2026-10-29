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
export type LoadPhase = 
/** no document has ever been requested */
"idle"
/** the document resource is requested and has not arrived */
 | "fetching"
/** the bytes arrived; the DOM, stylesheets and images are being built */
 | "parsing"
/** scripts and onload are executing; a navigation out of them is still possible */
 | "running"
/** loadDocument returned without navigating: the page owns the screen */
 | "ready"
/** the document could not be fetched */
 | "failed"
/** the page left the screen (データ放送でなくなった, or a failed quit) */
 | "exited";
export type LockApi = "lockModuleOnMemory" | "lockModuleOnMemoryEx" | "unlockModuleOnMemory" | "unlockModuleOnMemoryEx" | "unlockAllModulesOnMemory";
export type LockOutcome = 
/** the module was cached and is now locked */
"locked"
/** not cached: the request went to the carousel and resolves later (see `settledAs`) */
 | "requested"
/** the request was answered, but the module never became lockable */
 | "failed-after-request"
/** Ex refuses a module that the plain call holds, and the reverse (TR-B14 第二分冊 5.12.6.9) */
 | "refused-other-lock"
/** Ex is limited to components 0x40/0x50/0x60 in the A profile */
 | "refused-component"
/** the component is not in the PMT at all */
 | "no-pmt-component"
/** the component is in the PMT, but the DII does not list this module */
 | "no-dii-module"
/** the argument did not parse as /component/module */
 | "invalid-reference" | "unlocked" | "unlock-refused" | "all-unlocked";
export type LockRecord = {
    seq: number;
    /** performance.now() at the call */
    at: number;
    api: LockApi;
    /** the string the page passed, verbatim */
    module: string | null;
    /** /component/module, or null if it did not parse */
    normalized: string | null;
    /** the number the page got back (1, -1, -3, NaN); null stands for NaN */
    returned: number | null;
    outcome: LockOutcome;
    /** when the deferred part of the call finished, if it was deferred */
    settledAt: number | null;
    settledAs: LockOutcome | null;
    /** the status of the ModuleLocked bevent dispatched for this lock, null if none was */
    moduleLockedEvent: number | null;
};
export type TableOutcome = "found" | "not-found" | "fetch-failed" | "unparseable";
export type TableRecord = {
    seq: number;
    at: number;
    /** the table reference as the page wrote it */
    request: string | null;
    normalized: string | null;
    structure: string | null;
    outcome: TableOutcome;
    rows: number | null;
    columns: number | null;
    bytes: number | null;
    /** why it failed, verbatim if the engine threw */
    error: string | null;
};
export type ScriptRecord = {
    seq: number;
    at: number;
    /** "parse" = the script did not compile, "run" = it threw while executing */
    phase: "parse" | "run";
    script: string | null;
    message: string;
};
export type BeventRecord = {
    seq: number;
    at: number;
    type: string;
    /** module_ref / es_ref / message id, whatever the event carries */
    target: string | null;
    status: number | null;
};
export type PhaseRecord = {
    phase: LoadPhase;
    document: string | null;
    /** the document that was asked for, which differs from `document` while fetching */
    requested: string | null;
    since: number;
    detail: string | null;
};
export declare class Diagnostics {
    private readonly locks;
    private readonly tables;
    private readonly scripts;
    private readonly bevents;
    private seq;
    private phase;
    /** bumped by the owner so a stale asynchronous write cannot overwrite a newer phase */
    private phaseToken;
    private resolution;
    private next;
    setPhase(token: number, phase: LoadPhase, document: string | null, requested: string | null, detail?: string | null): void;
    get phaseTokenNow(): number;
    setResolution(declared: string | null, width: number, height: number, displayAspectRatio: string | null): void;
    lock(api: LockApi, module: string | null, normalized: string | null, returned: number, outcome: LockOutcome): LockRecord;
    /** The deferred half of a lock: the carousel answered, or the request was cancelled. */
    settleLock(record: LockRecord | null, outcome: LockOutcome): void;
    /**
     * A ModuleLocked bevent was dispatched. Attach it to the most recent lock for that module that
     * has not got one yet — that pairing is the whole point: the page waits for the *event*, not
     * for the return value, and a lock that returns 1 without an event is a page stuck on
     * 読み込み中.
     */
    moduleLockedEvent(module: string, isEx: boolean, status: number): void;
    table(request: string | null, normalized: string | null, structure: string | null, outcome: TableOutcome, extra?: {
        rows?: number;
        columns?: number;
        bytes?: number;
        error?: string;
    }): TableRecord;
    scriptError(phase: "parse" | "run", script: string | undefined, error: unknown): void;
    event(type: string, target: string | null, status: number | null): void;
    describeLocks(): LockRecord[];
    describeTables(): TableRecord[];
    describeScripts(): ScriptRecord[];
    describeEvents(): BeventRecord[];
    describePhase(): PhaseRecord & {
        ageMs: number;
    };
    describeResolution(): typeof this.resolution;
    /** How many events of a type reached a beitem — used to answer "is this subscription dead?". */
    countEvents(type: string, target: string | null): number;
    lastEventAt(type: string, target: string | null): number | null;
}
//# sourceMappingURL=introspection.d.ts.map