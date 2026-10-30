"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Profile = void 0;
exports.profileLetter = profileLetter;
/**
 * The numeric stream profile: the ARIB `component_type` ids that select a receiver profile.
 *
 * This lived in `resource.ts`, the 1,270-line hub, so every module that only needed the ids — the
 * charset codec (92 lines), `text.ts`, the NVRAM codec — value-imported the hub and, through it, the
 * server entity parser. It is a leaf: nothing here imports another client module.
 *
 * Not to be confused with the string `Profile` in `contracts.ts`, which is what the BML `load` event
 * reports ("C" / "A" / "BS" / "CS" / ""). The two are bridged only where the event is dispatched.
 */
var Profile;
(function (Profile) {
    Profile[Profile["BS"] = 7] = "BS";
    Profile[Profile["CS"] = 11] = "CS";
    Profile[Profile["TrProfileA"] = 12] = "TrProfileA";
    Profile[Profile["TrProfileC"] = 13] = "TrProfileC";
})(Profile || (exports.Profile = Profile = {}));
/**
 * The letter the BML `load` event and the diagnostics report for a numeric stream profile.
 *
 * This mapping used to live as a closure inside `loadDocument`, so the diagnostics snapshot reported
 * the raw enum (`String(profile)` → "13") while the load event reported "C" for the same receiver.
 * One function, both call sites.
 */
function profileLetter(profile) {
    switch (profile) {
        case Profile.TrProfileA:
            return "A";
        case Profile.TrProfileC:
            return "C";
        case Profile.BS:
            return "BS";
        case Profile.CS:
            return "CS";
        default:
            return "";
    }
}
//# sourceMappingURL=profile.js.map