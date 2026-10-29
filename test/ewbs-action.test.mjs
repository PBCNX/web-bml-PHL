// P2/EWBS: what an alert means for a receiver. The demuxer surfaces the alert (verified against a
// real stream in ewbs.test.mjs) and areaCovers decides coverage (verified against TVTest-PHL's
// DoesEwbsAreaCover on all 19,321 pairs); this is the step that turns those two into an action.
import test from "node:test";
import assert from "node:assert/strict";

import { decideEwbsAction } from "../dist/client/ewbs.js";

const alert = (areaCodes, overrides = {}) => ({
    type: "emergencyInfo",
    serviceId: 1,
    startEndFlag: true,
    signalLevel: false,
    areaCodes,
    ...overrides,
});

test("an alert for the receiver's own city is relevant and opens the configured page", () => {
    const decision = decideEwbsAction(alert([0x426]), 0x426, "/50/2000");

    assert.equal(decision.relevant, true);
    assert.deepEqual(decision.matchingAreas, [0x426]);
    assert.equal(decision.ends, false);
    assert.equal(decision.launch, "/50/2000");
});

test("an alert for another zone is not relevant and opens nothing", () => {
    const decision = decideEwbsAction(alert([0x621]), 0x426, "/50/2000");

    assert.equal(decision.relevant, false);
    assert.deepEqual(decision.matchingAreas, []);
    assert.equal(decision.launch, null);
});

test("a region-level alert concerns a city inside it", () => {
    // NCR (0x420) covers Manila (0x426) — the direction the coverage fix restored.
    const decision = decideEwbsAction(alert([0x420]), 0x426, "/50/2000");

    assert.equal(decision.relevant, true);
    assert.equal(decision.launch, "/50/2000");
});

test("a receiver with no area configured is shown every alert", () => {
    // areaRelevant() reads location 0 as "show everything", the same as an unconfigured receiver.
    const decision = decideEwbsAction(alert([0x621]), null, "/50/2000");

    assert.equal(decision.relevant, true);
    assert.equal(decision.launch, "/50/2000");
});

test("an alert that is ending stands down and opens nothing", () => {
    const decision = decideEwbsAction(alert([0x426], { startEndFlag: false }), 0x426, "/50/2000");

    assert.equal(decision.ends, true);
    assert.equal(decision.relevant, true, "it still says which area it ended for");
    assert.equal(decision.launch, null, "an ending alert must not open a page");
});

test("one matching area among several is enough, and the banner names them", () => {
    const decision = decideEwbsAction(alert([0x400, 0x426, 0x621]), 0x426, "/50/2000");

    assert.equal(decision.relevant, true);
    assert.deepEqual(decision.matchingAreas, [0x400, 0x426], "Luzon and Manila both concern Manila");
});

test("without a configured document the alert is still judged, just not opened", () => {
    const decision = decideEwbsAction(alert([0x426]), 0x426, undefined);

    assert.equal(decision.relevant, true);
    assert.equal(decision.launch, null);
});

test("a host may choose the document per alert", () => {
    const decision = decideEwbsAction(alert([0x426]), 0x426, (a) => `/50/${a.areaCodes[0] === 0x426 ? "2000" : "2001"}`);

    assert.equal(decision.launch, "/50/2000");
});

test("a document chooser that declines leaves nothing to open", () => {
    const decision = decideEwbsAction(alert([0x426]), 0x426, () => null);

    assert.equal(decision.relevant, true);
    assert.equal(decision.launch, null);
});
