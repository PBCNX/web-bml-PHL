/**
 * The configuration half of the diagnostics snapshot.
 *
 * The engine's three PH-era settings are per-host and invisible from outside: how an undesignated
 * ARIB text field is read (`textCoding`), which local-time offset the clock is using and where it came
 * from (`timeZoneOffsetMinutes` / the stream's TOT), the NVRAM area size, and the font families the
 * host registered. Every one of them changes what a page shows, so a "why does this look like that?"
 * report should be able to see them without guessing which host build is running.
 *
 * Kept pure on purpose: the snapshot assembler passes values in, so the precedence rules are testable
 * without a DOM.
 */

import { describeLocalTimeOffsetSource, resolveLocalTimeOffset, type LocalTimeOffsetSource } from "./time_offset";

export type ConfigurationSnapshot = {
    /** P7: `auto` is the PH reading, `arib` the strict Japanese one. */
    textCoding: "auto" | "arib",
    /** C16: the offset in use, in minutes from UTC (PH 480, Japan 540). */
    localTimeOffsetMinutes: number,
    localTimeOffsetSource: LocalTimeOffsetSource,
    /** C15: the NVRAM area size the host set for both areas, else null. */
    nvramAreaBytes: number | null,
    /** C15: the affiliation (group) area size when the host overrode only that area, else null. */
    nvramAffiliationBytes: number | null,
    /** C15: the broadcaster (local) area size when the host overrode only that area, else null. */
    nvramBroadcasterBytes: number | null,
    /** C13: the font families the host registered, in registration order. */
    fonts: string[],
};

export function describeConfiguration(input: {
    textCoding: "auto" | "arib",
    hostOffsetMinutes: number | null,
    streamOffsetMinutes: number | null,
    defaultOffsetMinutes: number,
    nvramAreaBytes: number | null,
    nvramAffiliationBytes: number | null,
    nvramBroadcasterBytes: number | null,
    fonts: readonly string[],
}): ConfigurationSnapshot {
    const hostOffset = input.hostOffsetMinutes;
    const streamOffset = input.streamOffsetMinutes;
    return {
        textCoding: input.textCoding,
        // The precedence is time_offset.ts's, not a second copy here: the host's setting wins over
        // the stream, both win over JST, and the snapshot must agree with Resources#localTimeOffsetMinutes.
        localTimeOffsetMinutes: resolveLocalTimeOffset(hostOffset, streamOffset, input.defaultOffsetMinutes),
        localTimeOffsetSource: describeLocalTimeOffsetSource(hostOffset, streamOffset),
        nvramAreaBytes: input.nvramAreaBytes,
        nvramAffiliationBytes: input.nvramAffiliationBytes,
        nvramBroadcasterBytes: input.nvramBroadcasterBytes,
        fonts: [...input.fonts],
    };
}
