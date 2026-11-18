// The capture fixtures are not in this repository.
//
// They are real broadcast transport streams (TBS, GMA, TV5, ABS-CBN, an EWBS window) with the PES
// payloads inside them — 12.6 MB of other people's content, which does not belong in the fork's
// history and cannot be published. They stay outside git: point `WEB_BML_FIXTURES` at a directory
// holding them and the capture tests run; without it they skip, so a clean clone passes `npm test`.
//
// The directory is expected to contain the `.m2ts` files at its root and the extracted payloads under
// `payloads/`, i.e. the shape `test/fixtures/` had when it lived here.
import { existsSync } from "node:fs";
import { join } from "node:path";

/** Where the captures live: `WEB_BML_FIXTURES`, else the old in-repo path (for a local checkout). */
export const FIXTURE_DIR = process.env.WEB_BML_FIXTURES ?? join(import.meta.dirname, "fixtures");

/** Absolute path of a fixture, or null when the captures are not available here. */
export function fixture(name) {
    const path = join(FIXTURE_DIR, name);
    return existsSync(path) ? path : null;
}

/**
 * A `skip` option for `test()`: false when every named fixture is present, else the reason to skip.
 *
 *   test("decodes the GMA window", { skip: skipWithout("ph-gma-window.m2ts") }, () => { ... });
 */
export function skipWithout(...names) {
    const missing = names.filter((name) => fixture(name) == null);
    if (missing.length === 0) {
        return false;
    }
    return `captures absent (${missing.join(", ")}); set WEB_BML_FIXTURES to run this`;
}
