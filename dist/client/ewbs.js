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
    // The profile's emergency-warning rules: start_end_flag 0 means the EWBS has ended, and the stop
    // procedure also removes the descriptor, which arrives here as `stopped`. A descriptor still in the
    // PMT with 0 is therefore an ended warning - it launches nothing, and it does not clear a live alert;
    // only `stopped` clears one. (Japan's TR-B14 Vol. 4 reads 0 as a test transmission; the PH profile
    // does not adopt that method, and its own test transmission is signalled by the TMCC activation flag,
    // which is not in the transport stream.)
    let launch = null;
    if (relevant && alert.startEndFlag && document != null) {
        launch = typeof document === "function" ? document(alert) : document;
    }
    return { relevant, matchingAreas, launch };
}
//# sourceMappingURL=ewbs.js.map