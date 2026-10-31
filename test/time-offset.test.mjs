import { test } from "node:test";
import assert from "node:assert/strict";

import {
    JST_OFFSET_MINUTES,
    broadcastWallClockToUnixMillis,
    localTimeOffsetMinutes,
    streamClockOffsetMinutes,
    totFieldUnixMillis,
    totWallClockToUnixMillis,
} from "../dist/client/time_offset.js";

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
    const ph = broadcastWallClockToUnixMillis(2026, 10, 27, 10, 0, 0, 480);
    assert.equal(new Date(ph).toISOString(), "2026-10-27T02:00:00.000Z", "PH 10:00 is 02:00Z");

    const japan = broadcastWallClockToUnixMillis(2026, 10, 27, 10, 0, 0, 540);
    assert.equal(new Date(japan).toISOString(), "2026-10-27T01:00:00.000Z", "JST 10:00 is 01:00Z");

    // The hours differ by exactly the offset difference: this is the one-hour bug in reverse.
    assert.equal(ph - japan, 60 * 60 * 1000);

    // The host's own zone is not part of the conversion, so it is stable across machines.
    assert.equal(broadcastWallClockToUnixMillis(2026, 10, 27, 10, 0, 0, 480), ph);

    // The old behaviour (JST) is the default, so a stream with no descriptor does not change.
    assert.equal(broadcastWallClockToUnixMillis(2026, 10, 27, 10, 0, 0), japan);
    assert.equal(JST_OFFSET_MINUTES, 540);
});

test("a Philippine stream that declares a zero offset reads as +8:00", () => {
    // Measured: the GMA capture's TOT declares country PHL with an offset of 0, while TV5 declares
    // +8:00 in the same country. A Philippine multiplex cannot be UTC+0, so a zero there is a
    // declaration bug, not time data: it maps to the standard offset. Every other value passes
    // through unchanged, including a zero from another country.
    const phZero = [{ tag: "localTimeOffset", offsets: [{ countryCode: 0x50484c, localTimeOffsetPolarity: false, localTimeOffset: 0x0000 }] }];
    assert.equal(localTimeOffsetMinutes(phZero), 0, "PHL + 0 means the field is UTC");
    assert.equal(streamClockOffsetMinutes(phZero), 480, "the page clock is Filipino time");

    const phEight = [{ tag: "localTimeOffset", offsets: [{ countryCode: 0x50484c, localTimeOffsetPolarity: false, localTimeOffset: 0x0800 }] }];
    assert.equal(localTimeOffsetMinutes(phEight), 480, "PHL + 8:00 unchanged");

    const japan = [{ tag: "localTimeOffset", offsets: [{ countryCode: 0x4a504e, localTimeOffsetPolarity: false, localTimeOffset: 0x0900 }] }];
    assert.equal(localTimeOffsetMinutes(japan), 540, "JPN + 9:00 unchanged");

    const britain = [{ tag: "localTimeOffset", offsets: [{ countryCode: 0x474252, localTimeOffsetPolarity: false, localTimeOffset: 0x0000 }] }];
    assert.equal(localTimeOffsetMinutes(britain), 0, "a zero from another country is real time data");

    assert.equal(localTimeOffsetMinutes(null), null, "no descriptor stays unknown");
});

test("the TOT field is reported verbatim; the descriptor never moves it", () => {
    const phNegative = [{ tag: "localTimeOffset", offsets: [{ countryCode: 0x50484c, localTimeOffsetPolarity: true, localTimeOffset: 0x0800 }] }];
    assert.equal(localTimeOffsetMinutes(phNegative), 480, "a PH declaration is reported as sent");

    const gmaJstMillis = Date.UTC(2023, 8, 14, 6, 24, 22);
    assert.equal(totFieldUnixMillis(gmaJstMillis), Date.UTC(2023, 8, 14, 15, 24, 22));
    assert.equal(new Date(totFieldUnixMillis(gmaJstMillis) + 480 * 60000).toISOString(), "2023-09-14T23:24:22.000Z");
});