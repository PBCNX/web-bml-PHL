"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PH_OFFSET_MINUTES = exports.JST_OFFSET_MINUTES = void 0;
exports.resolveLocalTimeOffset = resolveLocalTimeOffset;
exports.describeLocalTimeOffsetSource = describeLocalTimeOffsetSource;
exports.localTimeOffsetMinutes = localTimeOffsetMinutes;
exports.parseBroadcastWallClock = parseBroadcastWallClock;
exports.broadcastWallClockToUnixMillis = broadcastWallClockToUnixMillis;
exports.isPhilippineOffset = isPhilippineOffset;
exports.effectiveStreamOffsetMinutes = effectiveStreamOffsetMinutes;
/** JST, the fallback when the stream does not say: 9 hours east of UTC. */
exports.JST_OFFSET_MINUTES = 9 * 60;
/** The Philippine standard offset: 8 hours east of UTC. */
exports.PH_OFFSET_MINUTES = 8 * 60;
/** The ISO 3166 alpha-3 code the offset descriptor carries, packed into 24 bits. */
const COUNTRY_CODE_PHILIPPINES = 0x50484c; // "PHL"
/**
 * The offset in use, in minutes from UTC: the host's own setting wins over the stream's TOT, and
 * both win over JST. This is the single implementation — the clock getter and the configuration
 * snapshot both call it, so they cannot disagree.
 */
function resolveLocalTimeOffset(hostOffsetMinutes, streamOffsetMinutes, defaultOffsetMinutes = exports.JST_OFFSET_MINUTES) {
    return hostOffsetMinutes ?? streamOffsetMinutes ?? defaultOffsetMinutes;
}
/** Where {@link resolveLocalTimeOffset} took its value from. */
function describeLocalTimeOffsetSource(hostOffsetMinutes, streamOffsetMinutes) {
    return hostOffsetMinutes != null ? "host" : streamOffsetMinutes != null ? "stream" : "default";
}
/** BCD byte to binary, e.g. 0x30 -> 30. */
function bcdToNumber(value) {
    return ((value >> 4) & 0x0f) * 10 + (value & 0x0f);
}
/**
 * The signed local-time offset in minutes from a TOT's descriptors, or null when the stream carries
 * none. `localTimeOffsetPolarity` true is negative (STD-B10: 0 = positive, 1 = negative).
 */
function localTimeOffsetMinutes(descriptors) {
    if (descriptors == null) {
        return null;
    }
    for (const descriptor of descriptors) {
        if (descriptor.tag !== "localTimeOffset" && descriptor.tag !== "mhLocalTimeOffset") {
            continue;
        }
        const first = descriptor.offsets?.[0];
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
 * Parses the 14-digit `YYYYMMDDhhmmss` wall clock an absolute beitem timer carries.
 * Returns null when the value is not exactly 14 characters, so the caller can skip the timer.
 */
function parseBroadcastWallClock(value) {
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
function broadcastWallClockToUnixMillis(clock) {
    return Date.UTC(clock.year, clock.month - 1, clock.day, clock.hour, clock.minute, clock.second)
        - (clock.offsetMinutes ?? exports.JST_OFFSET_MINUTES) * 60_000;
}
/**
 * Whether the offset descriptor says this is the Philippines.
 *
 * The TOT section itself carries no country; the `local_time_offset_descriptor` does, one entry per
 * offset. This is what lets the clock tell a real declaration from GMA's zero.
 */
function isPhilippineOffset(descriptors) {
    if (descriptors == null) {
        return false;
    }
    for (const descriptor of descriptors) {
        if (descriptor.tag !== "localTimeOffset" && descriptor.tag !== "mhLocalTimeOffset") {
            continue;
        }
        const country = descriptor.offsets?.[0]?.countryCode;
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
function effectiveStreamOffsetMinutes(descriptors) {
    const declared = localTimeOffsetMinutes(descriptors);
    if (declared === 0 && isPhilippineOffset(descriptors)) {
        return exports.PH_OFFSET_MINUTES;
    }
    return declared;
}
//# sourceMappingURL=time_offset.js.map