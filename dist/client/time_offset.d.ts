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
export declare const JST_OFFSET_MINUTES: number;
/** The Philippine standard offset: 8 hours east of UTC. */
export declare const PH_OFFSET_MINUTES: number;
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
/**
 * The signed local-time offset in minutes from a TOT's descriptors, or null when the stream carries
 * none. `localTimeOffsetPolarity` true is negative (STD-B10: 0 = positive, 1 = negative).
 */
export declare function localTimeOffsetMinutes(descriptors: readonly {
    tag: string;
}[] | null | undefined): number | null;
/**
 * Converts the TOT's time field to UTC. The field is the broadcast **local** time (Japan: JST; the
 * Philippines: Filipino official time, UTC+8 — PH standard Table 35), and `arib-mmt-tlv-ts` hands it
 * over already converted as if it were JST. Add that back to recover the wall clock, then subtract
 * the stream's offset. A receiver that adds the offset again for display shows the broadcaster's time.
 */
export declare function totWallClockToUnixMillis(jstMillis: number, offsetMinutes: number | null): number;
/**
 * Convert a broadcast wall-clock time (year, month, day, hour, minute, second in the **broadcast
 * local time**) to UTC milliseconds.
 *
 * The host's own time zone is deliberately not involved: the wall clock is read as UTC and the
 * broadcast zone's offset is subtracted, so the result is the same wherever the page runs.
 * `broadcastOffsetMinutes` is the stream's local offset from UTC (`localTimeOffsetMinutes`, or
 * `JST_OFFSET_MINUTES` when unknown).
 */
export declare function broadcastWallClockToUnixMillis(year: number, month: number, day: number, hour: number, minute: number, second: number, broadcastOffsetMinutes?: number): number;
//# sourceMappingURL=time_offset.d.ts.map