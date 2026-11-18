// 2.4.7: the default offset follows the stream's identity — the box (+480) for PH, JST for a Japanese
// stream — so a host that never configures the clock still shows the right time for the material it
// plays. A host that wants the standard's "as sent" reading sets 0 explicitly.
import test from "node:test";
import assert from "node:assert/strict";

import { defaultOffsetMinutesForNetwork, PH_OFFSET_MINUTES, JST_OFFSET_MINUTES } from "../dist/client/time_offset.js";

test("a PH mux takes the box default", () => {
    // network 1 (GMA) and 3 with their small tsids, plus a satellite-numbered id on a PH tsid
    for (const [networkId, tsid] of [[1, 700], [3, 1000], [4, 700], [0xffff, 1], [0x7fe9, 700]]) {
        assert.equal(defaultOffsetMinutesForNetwork(networkId, tsid), PH_OFFSET_MINUTES, `network ${networkId} tsid ${tsid}`);
    }
});

test("a Japanese stream keeps JST", () => {
    // BS-TBS sends network 4 with tsid 0x4011
    for (const [networkId, tsid] of [[0x0004, 0x4011], [0x0006, 0x4010], [0x000a, 0x4001], [0x7880, 0x0001], [0x7fe8, 0x0001]]) {
        assert.equal(defaultOffsetMinutesForNetwork(networkId, tsid), JST_OFFSET_MINUTES, `network ${networkId} tsid ${tsid}`);
    }
});

test("no identity at all is the PH default", () => {
    for (const networkId of [null, undefined]) {
        assert.equal(defaultOffsetMinutesForNetwork(networkId, 16401), PH_OFFSET_MINUTES);
    }
});
