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
    return hostOffsetMinutes ?? streamOffsetMinutes ?? defaultOffsetMinutes;
}

/** Where {@link resolveLocalTimeOffset} took its value from. */
export function describeLocalTimeOffsetSource(hostOffsetMinutes: number | null, streamOffsetMinutes: number | null): LocalTimeOffsetSource {
    return hostOffsetMinutes != null ? "host" : streamOffsetMinutes != null ? "stream" : "default";
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
    const wallClockMillis = jstMillis + JST_OFFSET_MINUTES * 60_000;
    return wallClockMillis - (offsetMinutes ?? JST_OFFSET_MINUTES) * 60_000;
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
 * The offset a stream's declaration actually means, in minutes.
 *
 * A Philippine multiplex cannot sit at UTC+0: GMA's TOT carries `PHL` with a zero offset, which is a
 * declaration bug rather than time data, and trusting it puts every page clock eight hours out. A zero
 * offset from a PH stream is therefore read as the Philippine standard offset; anything else is passed
 * through unchanged, and a stream with no descriptor still answers null so the host or the default
 * decides.
 */
export function effectiveStreamOffsetMinutes(
    descriptors: readonly { tag: string }[] | null | undefined,
): number | null {
    // The Philippine profile deletes the local_offset_time descriptor (PH standard Table 36) and
    // defines the TOT time itself as Filipino official time, UTC+8 (Table 35, country "PHL"). A PH
    // multiplex therefore carries no usable offset: whatever the field says — 0, a stray -8:00, or
    // nothing — the broadcast local time is +8:00. Following the declared value moved the page clock
    // by an hour on GMA's 0 and by seven on TV5's negative declaration.
    if (isPhilippineOffset(descriptors)) {
        return PH_OFFSET_MINUTES;
    }
    return localTimeOffsetMinutes(descriptors);
}