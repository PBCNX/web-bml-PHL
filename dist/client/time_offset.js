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
exports.localTimeOffsetMinutes = localTimeOffsetMinutes;
exports.totWallClockToUnixMillis = totWallClockToUnixMillis;
exports.broadcastWallClockToUnixMillis = broadcastWallClockToUnixMillis;
/** JST, the fallback when the stream does not say: 9 hours east of UTC. */
exports.JST_OFFSET_MINUTES = 9 * 60;
/** The Philippine standard offset: 8 hours east of UTC. */
exports.PH_OFFSET_MINUTES = 8 * 60;
/** The ISO 3166 alpha-3 code the offset descriptor carries, packed into 24 bits. */
const COUNTRY_CODE_PHILIPPINES = 0x50484c; // "PHL"
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
        const signed = first.localTimeOffsetPolarity ? -total : total;
        // The PH profile deletes the local_offset_time descriptor (PH standard Table 36) and
        // defines the TOT time itself as Filipino official time, UTC+8 (Table 35, country "PHL").
        // A PH stream is therefore +8:00 whatever the field says - 0 (GMA), a stray negative
        // (TV5's -8:00), or nothing; following the field moved the page clock by hours. Japan
        // keeps its declared value.
        if (first.countryCode === COUNTRY_CODE_PHILIPPINES) {
            return exports.PH_OFFSET_MINUTES;
        }
        return signed;
    }
    return null;
}
/**
 * Converts the TOT's time field to UTC. The field is the broadcast **local** time (Japan: JST; the
 * Philippines: Filipino official time, UTC+8 — PH standard Table 35), and `arib-mmt-tlv-ts` hands it
 * over already converted as if it were JST. Add that back to recover the wall clock, then subtract
 * the stream's offset. A receiver that adds the offset again for display shows the broadcaster's time.
 */
function totWallClockToUnixMillis(jstMillis, offsetMinutes) {
    return jstMillis + exports.JST_OFFSET_MINUTES * 60_000 - (offsetMinutes ?? exports.JST_OFFSET_MINUTES) * 60_000;
}
/**
 * Convert a broadcast wall-clock time (year, month, day, hour, minute, second in the **broadcast
 * local time**) to UTC milliseconds.
 *
 * The host's own time zone is deliberately not involved: the wall clock is read as UTC and the
 * broadcast zone's offset is subtracted, so the result is the same wherever the page runs.
 * `broadcastOffsetMinutes` is the stream's local offset from UTC (`localTimeOffsetMinutes`, or
 * `JST_OFFSET_MINUTES` when unknown).
 */
function broadcastWallClockToUnixMillis(year, month, day, hour, minute, second, broadcastOffsetMinutes = exports.JST_OFFSET_MINUTES) {
    return Date.UTC(year, month - 1, day, hour, minute, second) - broadcastOffsetMinutes * 60_000;
}
//# sourceMappingURL=time_offset.js.map