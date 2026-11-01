/**
 * C16, the broadcast clock: the local time a stream declares.
 *
 * A BML page's absolute times (`show`/`hide` with `yymmddhhmmss`, the `Date` a page reads back, and
 * programme times) are in the **broadcast local time**, not in JST. ARIB carries the difference in the
 * TOT's `local_time_offset_descriptor` (tag 0x58): a polarity bit and a BCD hour/minute offset from
 * UTC. For Japan that is +9:00, which the engine used to hard-code; for the Philippines it is +8:00,
 * so the hard-coded 9 made every page clock an hour off in PH (the host workaround was to rewrite the
 * TDT PID before it reached the engine).
 *
 * The TOT's JST field is still a BCD JST time; `arib-mmt-tlv-ts`'s `mjdBCDToUnixEpoch` turns it into
 * UTC milliseconds. This module reads the offset descriptor and converts a broadcast wall-clock time
 * to UTC, so the receiver follows the stream instead of assuming Japan.
 *
 * 2026-11-02, per the PH guide's settled reading (BML-CLK-02, BML-CLK-09): the TOT field is the
 * **national time** (PH UTC+8) and `=0` fixes region, `local_time_offset` and `next_time_offset` at 0,
 * so a standard receiver shows the field as sent. The box does not: the ABS-CBN TVplus adds +8 to
 * whatever the field holds (hardware test 2026-10-06), and GMA puts UTC in the field. Both behaviours
 * are real, so the engine keeps reporting the field and the descriptor verbatim and the host picks a
 * policy (`docs/HOSTING.md`).
 */

/** JST, the fallback when the stream does not say: 9 hours east of UTC. */
export const JST_OFFSET_MINUTES = 9 * 60;

/** The Philippine standard offset: 8 hours east of UTC. */
export const PH_OFFSET_MINUTES = 8 * 60;

/** The ISO 3166 alpha-3 code the offset descriptor carries, packed into 24 bits. */
const COUNTRY_CODE_PHILIPPINES = 0x50484c; // "PHL"

/** Where the offset in use came from: the host's setting, the stream's TOT, or the JST default. */
export type LocalTimeOffsetSource = "host" | "stream" | "default";

/**
 * The offset in use, in minutes from UTC: the host's own setting wins over the stream's TOT, and
 * both win over JST. This is the single implementation — the clock getter and the configuration
 * snapshot both call it, so they cannot disagree.
 */
export function resolveLocalTimeOffset(
    hostOffsetMinutes: number | null,
    streamOffsetMinutes: number | null,
    defaultOffsetMinutes: number = JST_OFFSET_MINUTES,
): number {
    // The TOT descriptor is INERT on the field receiver: the ABS-CBN TVplus adds +8 to whatever the
    // time field holds, whatever the descriptor says (PCNX-DTV TimeInjector, hardware test
    // 2026-10-06), and a sweep of eight PH muxes found the same byte meaning UTC on one mux and
    // local on another. The engine therefore follows the box: the host's setting wins, else the
    // default. The stream's declaration stays diagnostic (streamTimeOffsetMinutes) and never moves
    // the clock.
    void streamOffsetMinutes;
    return hostOffsetMinutes ?? defaultOffsetMinutes;
}

/** Where {@link resolveLocalTimeOffset} took its value from. */
export function describeLocalTimeOffsetSource(hostOffsetMinutes: number | null, streamOffsetMinutes: number | null): LocalTimeOffsetSource {
    void streamOffsetMinutes;
    return hostOffsetMinutes != null ? "host" : "default";
}

/** The offset descriptor as `arib-mmt-tlv-ts` shapes it for a TS (`localTimeOffset`) or an MMT stream. */
export type LocalTimeOffsetDescriptor = {
    tag: "localTimeOffset" | "mhLocalTimeOffset";
    offsets: {
        /** ISO 3166 alpha-3 packed into 24 bits: "PHL" is 0x50484C. */
        countryCode?: number;
        localTimeOffsetPolarity: boolean;
        /** BCD: the high byte is hours, the low byte is minutes (0x0800 is +8:00, 0x0830 is +8:30). */
        localTimeOffset: number;
    }[];
};

/** BCD byte to binary, e.g. 0x30 -> 30. */
function bcdToNumber(value: number): number {
    return ((value >> 4) & 0x0f) * 10 + (value & 0x0f);
}

/**
 * The signed local-time offset in minutes from a TOT's descriptors, or null when the stream carries
 * none. `localTimeOffsetPolarity` true is negative (STD-B10: 0 = positive, 1 = negative).
 */
export function localTimeOffsetMinutes(
    descriptors: readonly { tag: string }[] | null | undefined,
): number | null {
    if (descriptors == null) {
        return null;
    }
    for (const descriptor of descriptors) {
        if (descriptor.tag !== "localTimeOffset" && descriptor.tag !== "mhLocalTimeOffset") {
            continue;
        }
        const first = (descriptor as LocalTimeOffsetDescriptor).offsets?.[0];
        if (first == null) {
            continue;
        }
        const hours = bcdToNumber((first.localTimeOffset >> 8) & 0xff);
        const minutes = bcdToNumber(first.localTimeOffset & 0xff);
        const total = hours * 60 + minutes;
        // A Philippine stream cannot sit west of UTC: TV5's descriptor byte 0x03 sets the bit the
        // parser reads as polarity, which would declare -8:00 for a field that is plainly local time
        // (its 01:38 field matches a 01:38 broadcast). For PH the magnitude is the offset; polarity
        // only matters elsewhere, where the stream is trusted.
        if (first.countryCode === COUNTRY_CODE_PHILIPPINES) {
            return total;
        }
        return first.localTimeOffsetPolarity ? -total : total;
    }
    return null;
}

/**
 * Converts the TOT's time field to UTC.
 *
 * The field is the broadcast **local** time (Japan: JST; the Philippines: Filipino official time,
 * UTC+8 — PH standard Table 35, whose offset descriptor is deleted in Table 36), and
 * `arib-mmt-tlv-ts` hands it over already converted as if it were JST. Add that back to recover the
 * wall clock, then subtract the stream's offset: Japan keeps its +9:00, the Philippines gets +8:00
 * whether the stream declares 0, a stray negative, or nothing. A receiver that adds the offset again
 * for display therefore shows the broadcaster's own clock.
 */
export function totWallClockToUnixMillis(jstMillis: number, offsetMinutes: number | null): number {
    // Kept for the tests that pinned the old shape; the offset no longer applies.
    void offsetMinutes;
    return totFieldUnixMillis(jstMillis);
}

/**
 * The TOT time field exactly as the broadcaster sent it, as epoch millis with the wall clock read
 * as UTC. No descriptor applies: the receiver ignores it, so the engine does too, and a host that
 * follows the box (PH: add +8:00) shows the same clock the viewer sees.
 */
export function totFieldUnixMillis(jstMillis: number): number {
    return jstMillis + JST_OFFSET_MINUTES * 60_000;
}
/** A broadcast wall clock: the fields a page declares, in the stream's local time. */
export interface BroadcastWallClock {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    /** The stream's local offset from UTC; JST when the stream has not declared one. */
    offsetMinutes?: number;
}

/**
 * Parses the 14-digit `YYYYMMDDhhmmss` wall clock an absolute beitem timer carries.
 * Returns null when the value is not exactly 14 characters, so the caller can skip the timer.
 */
export function parseBroadcastWallClock(value: string): BroadcastWallClock | null {
    if (value.length !== 14) {
        return null;
    }
    return {
        year: Number.parseInt(value.substring(0, 4)),
        month: Number.parseInt(value.substring(4, 6)),
        day: Number.parseInt(value.substring(6, 8)),
        hour: Number.parseInt(value.substring(8, 10)),
        minute: Number.parseInt(value.substring(10, 12)),
        second: Number.parseInt(value.substring(12, 14)),
    };
}

/**
 * Convert a broadcast wall-clock time (year, month, day, hour, minute, second in the **broadcast
 * local time**) to UTC milliseconds.
 *
 * The host's own time zone is deliberately not involved: the wall clock is read as UTC and the
 * broadcast zone's offset is subtracted, so the result is the same wherever the page runs.
 * `offsetMinutes` is the stream's local offset from UTC (`localTimeOffsetMinutes`, or
 * `JST_OFFSET_MINUTES` when unknown).
 */
export function broadcastWallClockToUnixMillis(clock: BroadcastWallClock): number {
    return Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, clock.second)
        - (clock.offsetMinutes ?? JST_OFFSET_MINUTES) * 60_000;
}

/**
 * Whether the offset descriptor says this is the Philippines.
 *
 * The TOT section itself carries no country; the `local_time_offset_descriptor` does, one entry per
 * offset. This is what lets the clock tell a real declaration from GMA's zero.
 */
export function isPhilippineOffset(descriptors: readonly { tag: string }[] | null | undefined): boolean {
    if (descriptors == null) {
        return false;
    }
    for (const descriptor of descriptors) {
        if (descriptor.tag !== "localTimeOffset" && descriptor.tag !== "mhLocalTimeOffset") {
            continue;
        }
        const country = (descriptor as LocalTimeOffsetDescriptor).offsets?.[0]?.countryCode;
        if (country === COUNTRY_CODE_PHILIPPINES) {
            return true;
        }
    }
    return false;
}

/**
 * The offset of the TOT's **time field** from UTC, in minutes, or null when the stream declares none.
 *
 * The descriptor is not decoration: it says what the field itself is. GMA declares PHL +0:00 and its
 * field is UTC (the capture was saved at 23:29 PH local and the field reads 15:24), while TV5 and PTV
 * declare +8:00 and their fields are local time. Japan's field is JST and normally carries no
 * descriptor at all. Null means the stream did not say, and the host or the default decides.
 */
export function effectiveStreamOffsetMinutes(
    descriptors: readonly { tag: string }[] | null | undefined,
): number | null {
    return localTimeOffsetMinutes(descriptors);
}

/**
 * The offset to **display** the broadcast clock at: the broadcaster's own time zone.
 *
 * The Philippines is +8:00 whatever the stream declares (PH standard Table 35), even when its time
 * field is UTC. Elsewhere it is what the stream declared, or JST when it declared nothing.
 */
export function streamClockOffsetMinutes(
    descriptors: readonly { tag: string }[] | null | undefined,
): number {
    if (isPhilippineOffset(descriptors)) {
        return PH_OFFSET_MINUTES;
    }
    return localTimeOffsetMinutes(descriptors) ?? JST_OFFSET_MINUTES;
}