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
export function formatModuleRef(componentId: number, moduleId: number): string {
    return `/${hex(componentId, 2)}/${hex(moduleId, 4)}`;
}

/** `cc/mmmm` — the same reference without the leading slash, for log lines. */
export function formatModuleRefForLog(componentId: number, moduleId: number): string {
    return `${hex(componentId, 2)}/${hex(moduleId, 4)}`;
}

function hex(value: number, width: number): string {
    return value.toString(16).padStart(width, "0");
}

/**
 * Every key group the BML key-group setting can name. `KeyGroup` in contracts.ts is the source of
 * truth; this list exists so a token can be validated at runtime.
 */
const KEY_GROUPS: readonly KeyGroup[] = ["basic", "data-button", "numeric-tuning", "other-tuning", "special-1", "special-2"];

/**
 * Parses a `--used-key-list` value into the groups it names, dropping unknown tokens.
 *
 * This used to be a whitelist written out at two call sites, and it omitted `other-tuning` — so a
 * page that named that group had it dropped from the `usedkeylistchanged` event while the key gate
 * (which read the raw list) still honoured it. Both now share this parser and the full vocabulary.
 */
export function parseUsedKeyList(value: string): Set<KeyGroup> {
    const groups = new Set<KeyGroup>();
    for (const token of value.split(" ")) {
        if (token.length === 0) {
            continue;
        }
        if ((KEY_GROUPS as readonly string[]).includes(token)) {
            groups.add(token as KeyGroup);
        }
    }
    return groups;
}
