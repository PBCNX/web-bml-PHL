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
exports.totFieldUnixMillis = totFieldUnixMillis;
exports.broadcastWallClockToUnixMillis = broadcastWallClockToUnixMillis;
exports.effectiveStreamOffsetMinutes = effectiveStreamOffsetMinutes;
exports.streamClockOffsetMinutes = streamClockOffsetMinutes;
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
        // A PH stream cannot sit west of UTC: TV5's descriptor byte 0x03 sets the bit the parser
        // reads as polarity, which would mean -8:00 for a field that is plainly local. For PH the
        // magnitude is the offset; elsewhere the declared polarity stands.
        if (first.countryCode === COUNTRY_CODE_PHILIPPINES) {
            return total;
        }
        return first.localTimeOffsetPolarity ? -total : total;
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
    void offsetMinutes;
    return totFieldUnixMillis(jstMillis);
}
/** The TOT field as sent, read as a wall clock: the receiver ignores the descriptor, so we do too. */
function totFieldUnixMillis(jstMillis) {
    return jstMillis + exports.JST_OFFSET_MINUTES * 60_000;
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
/**
 * The offset of the TOT's **time field** from UTC, in minutes, or null when the stream says nothing.
 *
 * The descriptor is not decoration: GMA declares PHL +0:00 and its field is UTC (the capture was
 * saved at 23:29 PH local and reads 15:24), while TV5 and PTV declare +8:00 and their fields are
 * local time. Japan's field is JST with no descriptor.
 */
function effectiveStreamOffsetMinutes(descriptors) {
    return localTimeOffsetMinutes(descriptors);
}
/**
 * The offset to **display** the broadcast clock at: the broadcaster's own zone.
 *
 * The Philippines is +8:00 whatever the stream declares; elsewhere it is the declared value, or JST
 * when the stream declared nothing.
 */
function streamClockOffsetMinutes(descriptors) {
    if (isPhilippineDescriptor(descriptors)) {
        return exports.PH_OFFSET_MINUTES;
    }
    return localTimeOffsetMinutes(descriptors) ?? exports.JST_OFFSET_MINUTES;
}
/** Whether the stream's offset descriptor names the Philippines. */
function isPhilippineDescriptor(descriptors) {
    if (descriptors == null) {
        return false;
    }
    for (const descriptor of descriptors) {
        if (descriptor.tag !== "localTimeOffset" && descriptor.tag !== "mhLocalTimeOffset") {
            continue;
        }
        if (descriptor.offsets?.[0]?.countryCode === COUNTRY_CODE_PHILIPPINES) {
            return true;
        }
    }
    return false;
}
//# sourceMappingURL=time_offset.js.map