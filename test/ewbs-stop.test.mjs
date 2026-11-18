// 3.0.0: start_end_flag 0 means the EWBS has ended, and the alert is cleared only when the descriptor
// leaves the PMT (`stopped`). A 0 therefore launches nothing and must not stand down a live alert.
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

test("start_end_flag 0 launches nothing, and the decision carries no test/ending state", () => {
    const decision = decideEwbsAction(alert([0x420], { startEndFlag: false }), 0x426, "/50/2000");
    assert.equal(decision.launch, null, "an ended warning opens nothing");
    assert.equal("stopped" in decision, false, "the decision has no ending: the browser keeps the alert");
    assert.equal("test" in decision, false, "there is no test state in the decision");
});

test("the stop message is explicit and carries no areas", () => {
    const stop = emergencyStopMessage(161);
    assert.equal(stop.type, "emergencyInfo");
    assert.equal(stop.serviceId, 161);
    assert.equal(stop.stopped, true);
    assert.deepEqual(stop.areaCodes, []);
    assert.equal(stop.startEndFlag, false);
});
