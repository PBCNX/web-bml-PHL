"use strict";
// The NVRAM area table as the standard sizes it, with the two PH-sized areas overridable.
// (Help text: C15. The standard's NVRAM page says "4 KB for one Affiliation" and "4 KB for one
// broadcaster"; the engine's base table follows the Japanese 64-byte areas, so a PH receiver passes
// `nvramAreaBytes: 4096` and gets 4 KB for the affiliation ("group") and broadcaster ("local") areas.
// The one-seg C-profile area ("Cprogroup") is not in the standard's table and keeps its size.)
Object.defineProperty(exports, "__esModule", { value: true });
exports.SIZED_AREA_PREFIXES = void 0;
exports.areaBytesFor = areaBytesFor;
exports.phAreaSizing = phAreaSizing;
const PH_AREA_BYTES = 4 * 1024;
/** The areas the standard sizes in kilobytes, by their URI prefix. */
exports.SIZED_AREA_PREFIXES = ["group", "local"];
function areaBytesFor(prefix, sizing, current) {
    if (prefix === "group") {
        return sizing.affiliationBytes ?? sizing.areaBytes ?? current;
    }
    if (prefix === "local") {
        return sizing.broadcasterBytes ?? sizing.areaBytes ?? current;
    }
    return current;
}
/** The PH profile's sizing: 4 KB for the affiliation and 4 KB for the broadcaster. */
function phAreaSizing() {
    return { areaBytes: PH_AREA_BYTES };
}
//# sourceMappingURL=nvram_sizing.js.map