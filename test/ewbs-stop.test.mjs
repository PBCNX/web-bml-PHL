// 3.0.0: an alert ends when the descriptor leaves the PMT (the profile's stop procedure: the activation flag off and the descriptor removed), not when start_end_flag is 0.
// TR-B14 calls 0 a test and the PH profile does not adopt that test method (TR-B14 Vol. 1; the PH profile does not adopt that test method), so a 0 must
// neither launch anything nor stand down a live alert.
import test from "node:test";
import assert from "node:assert/strict";

import { decideEwbsAction } from "../dist/client/ewbs.js";
import { emergencyStopMessage } from "../dist/server/decode_ts.js";

const alert = (areaCodes, overrides = {}) => ({
    type: "emergencyInfo",
    serviceId: 161,
    startEndFlag: true,
    signalLevel: false,
    areaCodes,
    ...overrides,
});

test("start_end_flag 0 is a test: no launch, and it is not reported as an ending", () => {
    const decision = decideEwbsAction(alert([0x420], { startEndFlag: false }), 0x426, "/50/2000");
    assert.equal(decision.test, true);
    assert.equal(decision.launch, null, "a test opens nothing");
    assert.equal("stopped" in decision, false, "the decision has no ending: the browser keeps the alert");
});

test("the stop message is explicit and carries no areas", () => {
    const stop = emergencyStopMessage(161);
    assert.equal(stop.type, "emergencyInfo");
    assert.equal(stop.serviceId, 161);
    assert.equal(stop.stopped, true);
    assert.deepEqual(stop.areaCodes, []);
    assert.equal(stop.startEndFlag, false);
});
