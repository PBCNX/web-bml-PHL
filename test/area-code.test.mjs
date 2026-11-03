// P2 — PH area codes in the engine: the table, and coverage with TVTest's DoesEwbsAreaCover()
// semantics. The counts are the table's provenance (139 entries, 4 zones, 17 regions, 118 cities), so
// a regeneration that silently changes them fails here. The same checks live in the editor's
// tools/check-areas.mjs; this file proves the engine's copy of the data is the same data.
import test from "node:test";
import assert from "node:assert/strict";
import {
    PH_AREAS, ZONE_MASK, REGION_MASK,
    areaByCode, areaName, isZone, isRegion, areaCovers, areaRelevant,
} from "../dist/client/area_code.js";

const zones = PH_AREAS.filter((a) => isZone(a.code));
const regions = PH_AREAS.filter((a) => isRegion(a.code));
const cities = PH_AREAS.filter((a) => !isZone(a.code) && !isRegion(a.code));

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
        assert.ok((area.code & ZONE_MASK) >= 0 && (area.code & REGION_MASK) >= 0);
    }
});

test("the region field is zone-relative", () => {
    // b8..b5 = 0010 is NCR under Luzon (0x420) and Western Visayas under Visayas (0x620): the same
    // region bits under two zones. Any code that labels a region arithmetically from the field is
    // wrong, and this is the check that says so.
    assert.equal(areaName(0x420), "NCR");
    assert.equal(areaName(0x620), "Western Visayas");
    assert.equal(areaName(0x820), "Zamboanga Peninsula");
    assert.ok(areaCovers(0x400, 0x420) && areaCovers(0x400, 0x620) === false);
});

test("coverage: nationwide, zone, region, city", () => {
    assert.equal(areaCovers(0x200, 0x426), true, "nationwide covers Manila");
    assert.equal(areaCovers(0x200, 0x800), true, "nationwide covers a Mindanao zone");
    assert.equal(areaCovers(0x400, 0x426), true, "Luzon covers NCR's city");
    assert.equal(areaCovers(0x400, 0x420), true, "Luzon covers the NCR region");
    assert.equal(areaCovers(0x420, 0x426), true, "NCR covers Manila");
    // Symmetric in this direction, as TVTest-PHL's DoesEwbsAreaCover() is: a viewer who selected the
    // whole region is covered by an alert for one of its cities, and a zone viewer by a region alert.
    assert.equal(areaCovers(0x426, 0x420), true, "a city alert concerns a viewer who selected the region");
    assert.equal(areaCovers(0x420, 0x400), true, "a region alert concerns a viewer in the zone");
    assert.equal(areaCovers(0x426, 0x200), true, "everything concerns a viewer who selected nationwide");
    assert.equal(areaCovers(0x426, 0x800), false, "but not a viewer in another zone");
    assert.equal(areaCovers(0x420, 0x800), false, "NCR does not cover Mindanao");
    assert.equal(areaCovers(0x426, 0x426), true, "a city covers itself");
    assert.equal(areaCovers(0x426, 0x427), false, "a city covers only itself");
});

test("the Japanese guard: 0x34D is never masked as a zone", () => {
    // 0x34D is Japan's area-common code, and 0x34D & 0xE00 == 0x200, which would read as PH
    // Nationwide. The table membership test is what stops it.
    assert.equal(areaCovers(0x34D, 0x426), false);
    assert.equal(areaCovers(0x34D, 0x34D), true);
    assert.equal(areaCovers(0x200, 0x34D), false);
    assert.equal(areaByCode(0x34D), null);
});

test("relevant(): either direction, and 0 means show everything", () => {
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

// The spot checks above are examples; these are the whole table. Every one of the 139 x 139 pairs is
// decided by the rule its announcing code belongs to, so a coverage bug that only shows up for one
// zone or one region cannot slip through. This is the property form of DoesEwbsAreaCover(), and it
// is deliberately self-contained: no editor checkout, no corpus, so it runs on a clean clone.
test("every one of the 19,321 pairs follows the coverage rule", () => {
    // The rule this transcribes is TVTest-PHL's DoesEwbsAreaCover() (AppMain.cpp), which
    // areaCovers now matches on all 19,321 pairs. It is symmetric where one side names a whole
    // zone or region: the alert is inside what that viewer asked to hear about.
    let checked = 0;
    const wrong = [];
    for (const alert of PH_AREAS) {
        const a = alert.code;
        assert.equal(areaCovers(0x200, a), true, `nationwide covers ${alert.name}`);
        assert.equal(areaCovers(a, 0x200), true, `${alert.name} concerns a viewer who selected nationwide`);
        for (const location of PH_AREAS) {
            const l = location.code;
            checked++;
            let expected;
            if (a === l || a === 0x200 || l === 0x200) {
                expected = true;
            } else if ((a & ZONE_MASK) !== (l & ZONE_MASK)) {
                expected = false;
            } else if (isZone(a) || isZone(l)) {
                expected = true;
            } else if ((a & REGION_MASK) !== (l & REGION_MASK)) {
                expected = false;
            } else {
                expected = isRegion(a) || isRegion(l);
            }
            const actual = areaCovers(a, l);
            if (actual !== expected && wrong.length < 5) {
                wrong.push(`0x${a.toString(16)} covers 0x${l.toString(16)}: ${actual}, rule says ${expected}`);
            }
        }
    }
    assert.deepEqual(wrong, []);
    assert.equal(checked, 139 * 139);
});
