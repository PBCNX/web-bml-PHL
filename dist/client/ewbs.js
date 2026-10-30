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
    const ends = !alert.startEndFlag;
    let launch = null;
    if (relevant && !ends && document != null) {
        launch = typeof document === "function" ? document(alert) : document;
    }
    return { relevant, matchingAreas, ends, launch };
}
//# sourceMappingURL=ewbs.js.map