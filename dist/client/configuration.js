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
function describeConfiguration(input) {
    const hostOffset = input.hostOffsetMinutes;
    const streamOffset = input.streamOffsetMinutes;
    return {
        textCoding: input.textCoding,
        localTimeOffsetMinutes: hostOffset ?? streamOffset ?? input.defaultOffsetMinutes,
        // The host's own setting wins over the stream, and both win over JST. This mirrors
        // Resources#localTimeOffsetMinutes — the snapshot must not disagree with the clock.
        localTimeOffsetSource: hostOffset != null ? "host" : streamOffset != null ? "stream" : "default",
        nvramAreaBytes: input.nvramAreaBytes,
        fonts: [...input.fonts],
    };
}
//# sourceMappingURL=configuration.js.map