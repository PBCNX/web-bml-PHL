// P2/C14 — PH area codes in the engine: the table, and coverage with TVTest-PHL's
// DoesEwbsAreaCover() semantics (`.public-work/src/AppMain.cpp:2236`). The counts are the table's
// provenance (139 entries, 4 zones, 17 regions, 118 cities), so a regeneration that silently changes
// them fails here; the coverage rule below is transcribed from the reference, not from our own
// implementation, because the earlier version of this file restated the implementation's rule and
// could not catch it being wrong (391 of the 19,321 pairs disagreed with the reference).
import test from "node:test";
import assert from "node:assert/strict";
import {
    PH_AREAS, ZONE_MASK, REGION_MASK,
    areaByCode, areaName, isZone, isRegion, areaCovers, areaRelevant,
} from "../dist/client/area_code.js";

const zones = PH_AREAS.filter((a) => isZone(a.code));
const regions = PH_AREAS.filter((a) => isRegion(a.code));
const cities = PH_AREAS.filter((a) => !isZone(a.code) && !isRegion(a.code));
const known = new Set(PH_AREAS.map((a) => a.code));

/**
 * The reference rule, written out from AppMain.cpp — deliberately independent of client/area_code.ts:
 *
 *   if (Alert == Location || Alert == 0x200 || Location == 0x200) return true;
 *   if ((Alert & 0xE00) != (Location & 0xE00)) return false;
 *   if (isZone(Alert) || isZone(Location))    return true;
 *   if ((Alert & 0xFE0) != (Location & 0xFE0)) return false;
 *   if (isRegion(Alert) || isRegion(Location)) return true;
 *   return false;
 *
 * plus the engine's guard for codes outside the PH table (exact compare, never masked).
 */
function referenceCovers(alert, location) {
    if (!known.has(alert) || !known.has(location)) {
        return alert === location;
    }
    if (alert === location || alert === 0x200 || location === 0x200) {
        return true;
    }
    if ((alert & ZONE_MASK) !== (location & ZONE_MASK)) {
        return false;
    }
    if (isZone(alert) || isZone(location)) {
        return true;
    }
    if ((alert & REGION_MASK) !== (location & REGION_MASK)) {
        return false;
    }
    if (isRegion(alert) || isRegion(location)) {
        return true;
    }
    return false;
}

test("the table is 139 areas: 4 zones, 17 regions, 118 cities", () => {
    assert.equal(PH_AREAS.length, 139);
    assert.equal(zones.length, 4);
    assert.equal(regions.length, 17);
    assert.equal(cities.length, 118);
    assert.equal(new Set(PH_AREAS.map((a) => a.code)).size, PH_AREAS.length, "codes are unique");
});

test("zone names, and the 12-bit packing", () => {
    assert.deepEqual(zones.map((z) => z.name), ["Nationwide", "Luzon", "Visayas", "Mindanao"]);
    for (const area of PH_AREAS) {
        assert.ok(area.code >= 0 && area.code <= 0xfff, `${area.name} fits 12 bits`);
    }
});

test("the region field is zone-relative", () => {
    // b8..b5 = 0010 is NCR under Luzon (0x420) and Western Visayas under Visayas (0x620): the same
    // region bits under two zones. Any code that labels a region arithmetically from the field is
    // wrong, and this is the check that says so.
    assert.equal(areaName(0x420), "NCR");
    assert.equal(areaName(0x620), "Western Visayas");
    assert.equal(areaName(0x820), "Zamboanga Peninsula");
    assert.equal(areaCovers(0x400, 0x420), true, "Luzon covers NCR");
    assert.equal(areaCovers(0x400, 0x620), false, "Luzon does not cover a Visayas region");
});

test("coverage is symmetric in the reference rule (C14 correction)", () => {
    // The three classes the earlier one-directional implementation got wrong: it answered "not
    // covered" where the reference answers "covered", 391 times over the 19,321 pairs.
    assert.equal(areaCovers(0x200, 0x426), true, "nationwide alert covers Manila");
    assert.equal(areaCovers(0x426, 0x200), true, "a nationwide viewer is covered by everything");
    assert.equal(areaCovers(0x420, 0x400), true, "a Luzon viewer is covered by an NCR alert");
    assert.equal(areaCovers(0x426, 0x420), true, "a region viewer is covered by a city alert inside it");
    // And the ones that must stay false.
    assert.equal(areaCovers(0x426, 0x427), false, "two different cities of a region do not meet");
    assert.equal(areaCovers(0x420, 0x800), false, "different zones never meet");
    assert.equal(areaCovers(0x800, 0x420), false, "different zones never meet, either direction");
});

test("the Japanese guard: 0x34D is never masked as a zone", () => {
    // 0x34D is Japan's area-common code, and 0x34D & 0xE00 == 0x200, which would read as PH
    // Nationwide. The table membership test is what stops it.
    assert.equal(areaCovers(0x34D, 0x426), false);
    assert.equal(areaCovers(0x34D, 0x34D), true);
    assert.equal(areaCovers(0x200, 0x34D), false);
    assert.equal(areaByCode(0x34D), null);
});

test("relevant(): 0 means show everything, otherwise the coverage rule", () => {
    assert.equal(areaRelevant(0x426, 0x420), true, "city alert reaches a region viewer");
    assert.equal(areaRelevant(0x420, 0x426), true, "region alert reaches a city viewer");
    assert.equal(areaRelevant(0x800, 0x420), false, "Cebu alert is not relevant in NCR");
    assert.equal(areaRelevant(0x800, 0), true, "location 0 shows everything");
});

test("names, misses and the accented cities", () => {
    assert.equal(areaName(0x426), "Manila");
    assert.equal(areaName(0xfff), "0xFFF");
    assert.equal(areaByCode(0x7ff), null);
    // The two names that are also P7 fixtures: the table carries ñ as UTF-8-derived text, the same
    // way the page text does.
    assert.equal(areaName(0x42a), "Parañaque");
    assert.equal(areaName(0x422), "Las Piñas");
});

test("every one of the 19,321 pairs agrees with the reference rule", () => {
    const wrong = [];
    let checked = 0;
    for (const alert of PH_AREAS) {
        for (const location of PH_AREAS) {
            checked++;
            const expected = referenceCovers(alert.code, location.code);
            const actual = areaCovers(alert.code, location.code);
            if (actual !== expected && wrong.length < 5) {
                wrong.push(`0x${alert.code.toString(16)} vs 0x${location.code.toString(16)}: ${actual}, reference says ${expected}`);
            }
        }
    }
    assert.deepEqual(wrong, []);
    assert.equal(checked, 139 * 139);
});
