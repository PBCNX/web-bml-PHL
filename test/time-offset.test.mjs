import { test } from "node:test";
import assert from "node:assert/strict";

import {
    JST_OFFSET_MINUTES,
    PH_OFFSET_MINUTES,
    broadcastWallClockToUnixMillis,
    describeLocalTimeOffsetSource,
    effectiveStreamOffsetMinutes,
    isPhilippineOffset,
    localTimeOffsetMinutes,
    parseBroadcastWallClock,
    resolveLocalTimeOffset,
} from "../dist/client/time_offset.js";

test("the offset precedence is host, then stream, then JST", () => {
    assert.equal(resolveLocalTimeOffset(480, 540), 480, "the host's setting wins over the stream");
    assert.equal(resolveLocalTimeOffset(null, 540), 540, "the stream's TOT is next");
    assert.equal(resolveLocalTimeOffset(null, null), JST_OFFSET_MINUTES, "JST is the fallback");
    assert.equal(resolveLocalTimeOffset(undefined, 540), 540, "an absent host setting is not zero");

    assert.equal(describeLocalTimeOffsetSource(480, 540), "host");
    assert.equal(describeLocalTimeOffsetSource(null, 540), "stream");
    assert.equal(describeLocalTimeOffsetSource(null, null), "default");
});

test("the TOT descriptor gives the stream's local offset, not JST", () => {
    // local_time_offset_descriptor: BCD hours in the high byte, BCD minutes in the low byte.
    const philippines = [{ tag: "localTimeOffset", offsets: [{ localTimeOffsetPolarity: false, localTimeOffset: 0x0800 }] }];
    assert.equal(localTimeOffsetMinutes(philippines), 480, "PH is UTC+8");

    const japan = [{ tag: "localTimeOffset", offsets: [{ localTimeOffsetPolarity: false, localTimeOffset: 0x0900 }] }];
    assert.equal(localTimeOffsetMinutes(japan), 540, "Japan is UTC+9");

    const thirty = [{ tag: "localTimeOffset", offsets: [{ localTimeOffsetPolarity: false, localTimeOffset: 0x0530 }] }];
    assert.equal(localTimeOffsetMinutes(thirty), 330, "5:30 must decode the BCD minutes");

    const negative = [{ tag: "mhLocalTimeOffset", offsets: [{ localTimeOffsetPolarity: true, localTimeOffset: 0x0530 }] }];
    assert.equal(localTimeOffsetMinutes(negative), -330, "polarity true is negative (STD-B10)");

    assert.equal(localTimeOffsetMinutes([]), null, "no descriptor -> the caller falls back to JST");
    assert.equal(localTimeOffsetMinutes(null), null);
    assert.equal(localTimeOffsetMinutes([{ tag: "somethingElse" }]), null);
});

test("a broadcast wall clock converts to UTC with the stream's offset", () => {
    // 2026-10-27 10:00 in the broadcast zone.
    const ph = broadcastWallClockToUnixMillis({ year: 2026, month: 10, day: 27, hour: 10, minute: 0, second: 0, offsetMinutes: 480 });
    assert.equal(new Date(ph).toISOString(), "2026-10-27T02:00:00.000Z", "PH 10:00 is 02:00Z");

    const japan = broadcastWallClockToUnixMillis({ year: 2026, month: 10, day: 27, hour: 10, minute: 0, second: 0, offsetMinutes: 540 });
    assert.equal(new Date(japan).toISOString(), "2026-10-27T01:00:00.000Z", "JST 10:00 is 01:00Z");

    // The hours differ by exactly the offset difference: this is the one-hour bug in reverse.
    assert.equal(ph - japan, 60 * 60 * 1000);

    // The host's own zone is not part of the conversion, so it is stable across machines.
    assert.equal(broadcastWallClockToUnixMillis({ year: 2026, month: 10, day: 27, hour: 10, minute: 0, second: 0, offsetMinutes: 480 }), ph);

    // The old behaviour (JST) is the default, so a stream with no descriptor does not change.
    assert.equal(broadcastWallClockToUnixMillis({ year: 2026, month: 10, day: 27, hour: 10, minute: 0, second: 0 }), japan);
    assert.equal(JST_OFFSET_MINUTES, 540);
});

test("the 14-digit beitem wall clock parses field by field", () => {
    assert.deepEqual(parseBroadcastWallClock("20261027103045"), {
        year: 2026, month: 10, day: 27, hour: 10, minute: 30, second: 45,
    });
    assert.equal(parseBroadcastWallClock("2026102710304"), null, "13 digits is not a wall clock");
    assert.equal(parseBroadcastWallClock(""), null);
});
test("a Philippine stream that declares a zero offset is read as +8:00", () => {
    // GMA's TOT: country PHL, polarity positive, offset 0x0000. Taken literally the page clock is eight
    // hours out, which is what a host saw before this rule.
    const phlZero = [{ tag: "localTimeOffset", offsets: [{ countryCode: 0x50484c, localTimeOffsetPolarity: false, localTimeOffset: 0x0000 }] }];
    assert.equal(isPhilippineOffset(phlZero), true);
    assert.equal(effectiveStreamOffsetMinutes(phlZero), PH_OFFSET_MINUTES);
});

test("a Philippine stream that declares +8:00 is passed through unchanged", () => {
    const phlEight = [{ tag: "localTimeOffset", offsets: [{ countryCode: 0x50484c, localTimeOffsetPolarity: false, localTimeOffset: 0x0800 }] }];
    assert.equal(effectiveStreamOffsetMinutes(phlEight), 480);
});

test("Japan's +9:00 is untouched, and a missing descriptor stays unknown", () => {
    const jst = [{ tag: "localTimeOffset", offsets: [{ countryCode: 0x4a504e, localTimeOffsetPolarity: false, localTimeOffset: 0x0900 }] }];
    assert.equal(effectiveStreamOffsetMinutes(jst), 540);
    assert.equal(effectiveStreamOffsetMinutes([]), null);
    assert.equal(effectiveStreamOffsetMinutes(null), null);
});

test("a zero offset outside the Philippines is still zero", () => {
    // The rule is about the country, not about zero: another country may genuinely sit at UTC+0.
    const gmt = [{ tag: "localTimeOffset", offsets: [{ countryCode: 0x474252, localTimeOffsetPolarity: false, localTimeOffset: 0x0000 }] }];
    assert.equal(effectiveStreamOffsetMinutes(gmt), 0);
});