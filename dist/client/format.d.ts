/**
 * The module reference format the engine uses everywhere: `/cc/mmmm`, the component id as two hex
 * digits and the module id as four.
 *
 * This was hand-written in two private helpers and seven inline templates. The diagnostics depend on
 * it exactly: `LockRecord.normalized` is paired with ModuleLocked events by string equality, so two
 * copies of the format that drift by one character make the lock↔event record silently stop matching.
 */
import type { KeyGroup } from "./contracts";
/** `/cc/mmmm` — the canonical module reference. */
export declare function formatModuleRef(componentId: number, moduleId: number): string;
/** `cc/mmmm` — the same reference without the leading slash, for log lines. */
export declare function formatModuleRefForLog(componentId: number, moduleId: number): string;
/**
 * Parses a `--used-key-list` value into the groups it names, dropping unknown tokens.
 *
 * This used to be a whitelist written out at two call sites, and it omitted `other-tuning` — so a
 * page that named that group had it dropped from the `usedkeylistchanged` event while the key gate
 * (which read the raw list) still honoured it. Both now share this parser and the full vocabulary.
 */
export declare function parseUsedKeyList(value: string): Set<KeyGroup>;
//# sourceMappingURL=format.d.ts.map