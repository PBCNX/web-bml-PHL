"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PH_AREAS = exports.REGION_MASK = exports.ZONE_MASK = void 0;
exports.areaByCode = areaByCode;
exports.areaName = areaName;
exports.isZone = isZone;
exports.isRegion = isRegion;
exports.areaCovers = areaCovers;
exports.areaRelevant = areaRelevant;
exports.ZONE_MASK = 0xe00;
exports.REGION_MASK = 0xfe0;
/** Every Philippine area: 139 entries, 4 zones, 17 regions, cities in between. */
exports.PH_AREAS = [
    { code: 0x200, zone: 0x200, region: 0x200, name: "Nationwide" },
    { code: 0x400, zone: 0x400, region: 0x400, name: "Luzon" },
    { code: 0x420, zone: 0x400, region: 0x420, name: "NCR" },
    { code: 0x421, zone: 0x400, region: 0x420, name: "Caloocan" },
    { code: 0x422, zone: 0x400, region: 0x420, name: "Las Piñas" },
    { code: 0x423, zone: 0x400, region: 0x420, name: "Makati" },
    { code: 0x424, zone: 0x400, region: 0x420, name: "Malabon" },
    { code: 0x425, zone: 0x400, region: 0x420, name: "Mandaluyong" },
    { code: 0x426, zone: 0x400, region: 0x420, name: "Manila" },
    { code: 0x427, zone: 0x400, region: 0x420, name: "Marikina" },
    { code: 0x428, zone: 0x400, region: 0x420, name: "Muntinlupa" },
    { code: 0x429, zone: 0x400, region: 0x420, name: "Navotas" },
    { code: 0x42A, zone: 0x400, region: 0x420, name: "Parañaque" },
    { code: 0x42B, zone: 0x400, region: 0x420, name: "Pasay" },
    { code: 0x42C, zone: 0x400, region: 0x420, name: "Pasig" },
    { code: 0x42D, zone: 0x400, region: 0x420, name: "Pateros" },
    { code: 0x42E, zone: 0x400, region: 0x420, name: "Quezon City" },
    { code: 0x42F, zone: 0x400, region: 0x420, name: "San Juan" },
    { code: 0x430, zone: 0x400, region: 0x420, name: "Taguig" },
    { code: 0x431, zone: 0x400, region: 0x420, name: "Valenzuela" },
    { code: 0x440, zone: 0x400, region: 0x440, name: "CAR" },
    { code: 0x441, zone: 0x400, region: 0x440, name: "Abra" },
    { code: 0x442, zone: 0x400, region: 0x440, name: "Apayao" },
    { code: 0x443, zone: 0x400, region: 0x440, name: "Baguio" },
    { code: 0x444, zone: 0x400, region: 0x440, name: "Benguet" },
    { code: 0x445, zone: 0x400, region: 0x440, name: "Ifugao" },
    { code: 0x446, zone: 0x400, region: 0x440, name: "Kalinga" },
    { code: 0x447, zone: 0x400, region: 0x440, name: "Mt. Province" },
    { code: 0x460, zone: 0x400, region: 0x460, name: "Ilocos Region" },
    { code: 0x461, zone: 0x400, region: 0x460, name: "Ilocos Norte" },
    { code: 0x462, zone: 0x400, region: 0x460, name: "Ilocos Sur" },
    { code: 0x463, zone: 0x400, region: 0x460, name: "La Union" },
    { code: 0x464, zone: 0x400, region: 0x460, name: "Pangasinan" },
    { code: 0x480, zone: 0x400, region: 0x480, name: "Cagayan Valley" },
    { code: 0x481, zone: 0x400, region: 0x480, name: "Batanes" },
    { code: 0x482, zone: 0x400, region: 0x480, name: "Cagayan" },
    { code: 0x483, zone: 0x400, region: 0x480, name: "Isabela" },
    { code: 0x484, zone: 0x400, region: 0x480, name: "Nueva Vizcaya" },
    { code: 0x485, zone: 0x400, region: 0x480, name: "Quirino" },
    { code: 0x486, zone: 0x400, region: 0x480, name: "Santiago" },
    { code: 0x4A0, zone: 0x400, region: 0x4A0, name: "Central Luzon" },
    { code: 0x4A1, zone: 0x400, region: 0x4A0, name: "Angeles" },
    { code: 0x4A2, zone: 0x400, region: 0x4A0, name: "Aurora" },
    { code: 0x4A3, zone: 0x400, region: 0x4A0, name: "Bataan" },
    { code: 0x4A4, zone: 0x400, region: 0x4A0, name: "Bulacan" },
    { code: 0x4A5, zone: 0x400, region: 0x4A0, name: "Nueva Ecija" },
    { code: 0x4A6, zone: 0x400, region: 0x4A0, name: "Olongapo" },
    { code: 0x4A7, zone: 0x400, region: 0x4A0, name: "Pampanga" },
    { code: 0x4A8, zone: 0x400, region: 0x4A0, name: "Tarlac" },
    { code: 0x4A9, zone: 0x400, region: 0x4A0, name: "Zambales" },
    { code: 0x4C0, zone: 0x400, region: 0x4C0, name: "CALABARZON" },
    { code: 0x4C1, zone: 0x400, region: 0x4C0, name: "Batangas" },
    { code: 0x4C2, zone: 0x400, region: 0x4C0, name: "Cavite" },
    { code: 0x4C3, zone: 0x400, region: 0x4C0, name: "Laguna" },
    { code: 0x4C4, zone: 0x400, region: 0x4C0, name: "Lucena" },
    { code: 0x4C5, zone: 0x400, region: 0x4C0, name: "Quezon" },
    { code: 0x4C6, zone: 0x400, region: 0x4C0, name: "Rizal" },
    { code: 0x4E0, zone: 0x400, region: 0x4E0, name: "MIMAROPA" },
    { code: 0x4E1, zone: 0x400, region: 0x4E0, name: "Marinduque" },
    { code: 0x4E2, zone: 0x400, region: 0x4E0, name: "Occidental Mindoro" },
    { code: 0x4E3, zone: 0x400, region: 0x4E0, name: "Oriental Mindoro" },
    { code: 0x4E4, zone: 0x400, region: 0x4E0, name: "Palawan" },
    { code: 0x4E5, zone: 0x400, region: 0x4E0, name: "Puerto Princesa" },
    { code: 0x4E6, zone: 0x400, region: 0x4E0, name: "Romblon" },
    { code: 0x500, zone: 0x400, region: 0x500, name: "Bicol Region" },
    { code: 0x501, zone: 0x400, region: 0x500, name: "Albay" },
    { code: 0x502, zone: 0x400, region: 0x500, name: "Camarines Sur" },
    { code: 0x503, zone: 0x400, region: 0x500, name: "Camarines Norte" },
    { code: 0x504, zone: 0x400, region: 0x500, name: "Catanduanes" },
    { code: 0x505, zone: 0x400, region: 0x500, name: "Masbate" },
    { code: 0x506, zone: 0x400, region: 0x500, name: "Naga" },
    { code: 0x507, zone: 0x400, region: 0x500, name: "Sorsogon" },
    { code: 0x600, zone: 0x600, region: 0x600, name: "Visayas" },
    { code: 0x620, zone: 0x600, region: 0x620, name: "Western Visayas" },
    { code: 0x621, zone: 0x600, region: 0x620, name: "Aklan" },
    { code: 0x622, zone: 0x600, region: 0x620, name: "Antique" },
    { code: 0x623, zone: 0x600, region: 0x620, name: "Bacolod" },
    { code: 0x624, zone: 0x600, region: 0x620, name: "Capiz" },
    { code: 0x625, zone: 0x600, region: 0x620, name: "Guimaras" },
    { code: 0x626, zone: 0x600, region: 0x620, name: "Iloilo" },
    { code: 0x627, zone: 0x600, region: 0x620, name: "Iloilo City" },
    { code: 0x628, zone: 0x600, region: 0x620, name: "Negros Occidental" },
    { code: 0x640, zone: 0x600, region: 0x640, name: "Central Visayas" },
    { code: 0x641, zone: 0x600, region: 0x640, name: "Bohol" },
    { code: 0x642, zone: 0x600, region: 0x640, name: "Cebu" },
    { code: 0x643, zone: 0x600, region: 0x640, name: "Cebu City" },
    { code: 0x644, zone: 0x600, region: 0x640, name: "Lapu Lapu" },
    { code: 0x645, zone: 0x600, region: 0x640, name: "Negros Oriental" },
    { code: 0x646, zone: 0x600, region: 0x640, name: "Siquijor" },
    { code: 0x660, zone: 0x600, region: 0x660, name: "Eastern Visayas" },
    { code: 0x661, zone: 0x600, region: 0x660, name: "Biliran" },
    { code: 0x662, zone: 0x600, region: 0x660, name: "Eastern Samar" },
    { code: 0x663, zone: 0x600, region: 0x660, name: "Leyte" },
    { code: 0x664, zone: 0x600, region: 0x660, name: "Northern Samar" },
    { code: 0x665, zone: 0x600, region: 0x660, name: "Ormoc" },
    { code: 0x666, zone: 0x600, region: 0x660, name: "Samar" },
    { code: 0x667, zone: 0x600, region: 0x660, name: "Southern Leyte" },
    { code: 0x668, zone: 0x600, region: 0x660, name: "Tacloban" },
    { code: 0x800, zone: 0x800, region: 0x800, name: "Mindanao" },
    { code: 0x820, zone: 0x800, region: 0x820, name: "Zamboanga Peninsula" },
    { code: 0x821, zone: 0x800, region: 0x820, name: "Isabela City" },
    { code: 0x822, zone: 0x800, region: 0x820, name: "Zamboanga City" },
    { code: 0x823, zone: 0x800, region: 0x820, name: "Zamboanga del Norte" },
    { code: 0x824, zone: 0x800, region: 0x820, name: "Zamboanga del Sur" },
    { code: 0x825, zone: 0x800, region: 0x820, name: "Zamboanga Sibugay" },
    { code: 0x840, zone: 0x800, region: 0x840, name: "Northern Mindanao" },
    { code: 0x841, zone: 0x800, region: 0x840, name: "Bukidnon" },
    { code: 0x842, zone: 0x800, region: 0x840, name: "Cagayan de Oro" },
    { code: 0x843, zone: 0x800, region: 0x840, name: "Camiguin" },
    { code: 0x844, zone: 0x800, region: 0x840, name: "Iligan" },
    { code: 0x845, zone: 0x800, region: 0x840, name: "Lanao del Norte" },
    { code: 0x846, zone: 0x800, region: 0x840, name: "Misamis Occidental" },
    { code: 0x847, zone: 0x800, region: 0x840, name: "Misamis Oriental" },
    { code: 0x860, zone: 0x800, region: 0x860, name: "Davao Region" },
    { code: 0x861, zone: 0x800, region: 0x860, name: "Compostela Valley" },
    { code: 0x862, zone: 0x800, region: 0x860, name: "Davao City" },
    { code: 0x863, zone: 0x800, region: 0x860, name: "Davao del Norte" },
    { code: 0x864, zone: 0x800, region: 0x860, name: "Davao del Sur" },
    { code: 0x865, zone: 0x800, region: 0x860, name: "Davao Oriental" },
    { code: 0x880, zone: 0x800, region: 0x880, name: "SOCCSKSARGEN" },
    { code: 0x881, zone: 0x800, region: 0x880, name: "Cotabato" },
    { code: 0x882, zone: 0x800, region: 0x880, name: "Cotabato City" },
    { code: 0x883, zone: 0x800, region: 0x880, name: "General Santos" },
    { code: 0x884, zone: 0x800, region: 0x880, name: "Sarangani" },
    { code: 0x885, zone: 0x800, region: 0x880, name: "South Cotabato" },
    { code: 0x886, zone: 0x800, region: 0x880, name: "Sultan Kudarat" },
    { code: 0x8A0, zone: 0x800, region: 0x8A0, name: "CARAGA" },
    { code: 0x8A1, zone: 0x800, region: 0x8A0, name: "Agusan del Norte" },
    { code: 0x8A2, zone: 0x800, region: 0x8A0, name: "Agusan del Sur" },
    { code: 0x8A3, zone: 0x800, region: 0x8A0, name: "Butuan" },
    { code: 0x8A4, zone: 0x800, region: 0x8A0, name: "Dinagat Islands" },
    { code: 0x8A5, zone: 0x800, region: 0x8A0, name: "Surigao del Norte" },
    { code: 0x8A6, zone: 0x800, region: 0x8A0, name: "Surigao del Sur" },
    { code: 0x8C0, zone: 0x800, region: 0x8C0, name: "ARMM" },
    { code: 0x8C1, zone: 0x800, region: 0x8C0, name: "Basilan" },
    { code: 0x8C2, zone: 0x800, region: 0x8C0, name: "Lanao del Sur" },
    { code: 0x8C3, zone: 0x800, region: 0x8C0, name: "Maguindanao" },
    { code: 0x8C4, zone: 0x800, region: 0x8C0, name: "Sulu" },
    { code: 0x8C5, zone: 0x800, region: 0x8C0, name: "Tawi-Tawi" },
];
const byCode = new Map(exports.PH_AREAS.map(area => [area.code, area]));
const zoneCodes = new Set(exports.PH_AREAS.filter(area => (area.code & 0x1ff) === 0 && (area.code & exports.ZONE_MASK) !== 0).map(area => area.code));
const regionCodes = new Set(exports.PH_AREAS.filter(area => (area.code & 0x1f) === 0 && (area.code & exports.REGION_MASK) !== 0 && !zoneCodes.has(area.code)).map(area => area.code));
/** The area record for a code, or null when it is not in the table. */
function areaByCode(code) {
    return byCode.get(Number(code)) ?? null;
}
/** A display name for a code, or the code itself when unknown. */
function areaName(code) {
    const area = areaByCode(code);
    return area == null ? "0x" + Number(code).toString(16).toUpperCase() : area.name;
}
function isZone(code) {
    return zoneCodes.has(Number(code));
}
function isRegion(code) {
    return regionCodes.has(Number(code));
}
/** The nationwide zone code. No city carries its bits, so no mask can find it. */
const NATIONWIDE_CODE = 0x200;
/**
 * Does an alert announced for `alertCode` concern a viewer whose location is `locationCode`?
 *
 * This is TVTest-PHL's `DoesEwbsAreaCover()` (`AppMain.cpp`), and it is deliberately symmetric in
 * one direction that reads oddly at first: a viewer who selected a whole zone is covered by an alert
 * for a region or city inside it, because the alert is inside what they asked to hear about. The
 * allocation is a tree — zone (b11-b9) | region (b8-b5) | city (b4-b0) — so two codes meet when one
 * sits inside the other:
 *
 *   - nationwide covers everyone, and a viewer who selected nationwide is covered by everything;
 *   - different zones never meet;
 *   - within a zone, a zone-level code on either side covers the whole zone;
 *   - within a region, a region-level code on either side covers the region's cities;
 *   - otherwise they are two different cities and do not meet.
 *
 * 0x200 has to be named explicitly: it is a zone code that no city carries the bits of, so no mask
 * finds it, in either direction.
 */
function areaCovers(alertCode, locationCode) {
    const alert = Number(alertCode);
    const location = Number(locationCode);
    // Only Philippine codes are packed this way. A code outside this table is compared exactly and
    // never masked: 0x34D (Japan-wide) & ZONE_MASK would otherwise read as a zone, and a PH
    // nationwide alert must not claim a Japanese location either.
    if (!byCode.has(alert) || !byCode.has(location)) {
        return alert === location;
    }
    if (alert === location || alert === NATIONWIDE_CODE || location === NATIONWIDE_CODE) {
        return true;
    }
    // Different zones never meet.
    if ((alert & exports.ZONE_MASK) !== (location & exports.ZONE_MASK)) {
        return false;
    }
    // Same zone: a zone-level code on either side covers everything under it.
    if (isZone(alert) || isZone(location)) {
        return true;
    }
    if ((alert & exports.REGION_MASK) !== (location & exports.REGION_MASK)) {
        return false;
    }
    // Same region: a region-level code on either side covers its cities.
    if (isRegion(alert) || isRegion(location)) {
        return true;
    }
    // Two different cities of the same region.
    return false;
}
/**
 * Should a viewer in `locationCode` see an alert for `alertCode`? Either direction counts — a city
 * alert matters to a viewer who selected the region, and a region alert matters to a city viewer —
 * and location 0 means the receiver has no area set, so everything is shown.
 */
function areaRelevant(alertCode, locationCode) {
    const location = Number(locationCode);
    if (!location) {
        return true;
    }
    // areaCovers is symmetric since it follows DoesEwbsAreaCover (a zone viewer is covered by a region
    // alert inside it), so the mirrored call that used to be here could never be the one that matched.
    return areaCovers(alertCode, location);
}
//# sourceMappingURL=area_code.js.map