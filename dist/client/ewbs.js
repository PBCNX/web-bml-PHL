"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decideEwbsAction = decideEwbsAction;
const area_code_1 = require("./area_code");
/**
 * Decide what an alert means for a receiver.
 *
 * `areaCode` null/0 means the host has no area configured, which `areaRelevant()` treats as "show
 * everything" — the same reading the receiver settings use for an unconfigured box.
 */
function decideEwbsAction(alert, areaCode, document) {
    const matchingAreas = alert.areaCodes.filter((code) => (0, area_code_1.areaRelevant)(code, areaCode ?? 0));
    const relevant = matchingAreas.length > 0;
    // TR-B14 Vol. 1, Emergency Information Descriptor: start_end_flag 1 is a real emergency warning,
    // 0 is a TEST one - not an ending. The PH profile does not adopt that test method (TR-B14 Vol. 1; the PH profile does not adopt that test method) and
    // ends an alert by removing the descriptor (the profile's stop procedure: the activation flag off and the descriptor removed), which arrives as `stopped`. So a test is
    // ignored here, and it must never stand down a live alert in the caller.
    const test = !alert.startEndFlag;
    let launch = null;
    if (relevant && !test && document != null) {
        launch = typeof document === "function" ? document(alert) : document;
    }
    return { relevant, matchingAreas, test, launch };
}
//# sourceMappingURL=ewbs.js.map