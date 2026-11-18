"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.describeConfiguration = describeConfiguration;
const time_offset_1 = require("./time_offset");
function describeConfiguration(input) {
    const hostOffset = input.hostOffsetMinutes;
    const streamOffset = input.streamOffsetMinutes;
    return {
        textCoding: input.textCoding,
        // The precedence is time_offset.ts's, not a second copy here: the host's setting wins over
        // the stream, both win over JST, and the snapshot must agree with Resources#localTimeOffsetMinutes.
        localTimeOffsetMinutes: (0, time_offset_1.resolveLocalTimeOffset)(hostOffset, streamOffset, input.defaultOffsetMinutes),
        localTimeOffsetSource: (0, time_offset_1.describeLocalTimeOffsetSource)(hostOffset, streamOffset),
        nvramAreaBytes: input.nvramAreaBytes,
        nvramAffiliationBytes: input.nvramAffiliationBytes,
        nvramBroadcasterBytes: input.nvramBroadcasterBytes,
        fonts: [...input.fonts],
    };
}
//# sourceMappingURL=configuration.js.map