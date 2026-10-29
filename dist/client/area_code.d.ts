/**
 * P2 — Philippine EWBS area codes, in the engine.
 *
 * The 139 codes (4 wide-area zones, 17 regions, 118 cities) are the Philippine allocation from the
 * standard's own Fig AP10-3, as carried by TVTest-PHL's `EwbsAreaTable.h` and verified against the
 * allocation table twice (`TVtest/docs/area-codes.md`). Packing is zone(3) | region(4) | city(5), 12
 * bits:
 *
 *   zone   = code & 0xE00   a zone code has (code & 0x1FF) == 0 and covers everything below it
 *   region = code & 0xFE0   a region code has (code & 0x1F) == 0 and covers its cities
 *   city   = exact
 *
 * The masks are Philippine conventions only. Japan's allocation is flat and scattered — `0x34D` is
 * Japan-wide, not a zone — so `areaCovers()` refuses to mask a code that is not in this table.
 *
 * Generated from `PBCNX/BML-editor` `apps/designer/src/areas.js`, which is generated from
 * `tools/data/ph_area_codes.tsv` and checked by `tools/check-areas.mjs`. Do not edit the table by
 * hand; regenerate it there and copy the data.
 */
export type AreaCode = {
    code: number;
    zone: number;
    region: number;
    name: string;
};
export declare const ZONE_MASK = 3584;
export declare const REGION_MASK = 4064;
/** Every Philippine area: 139 entries, 4 zones, 17 regions, cities in between. */
export declare const PH_AREAS: readonly AreaCode[];
/** The area record for a code, or null when it is not in the table. */
export declare function areaByCode(code: number): AreaCode | null;
/** A display name for a code, or the code itself when unknown. */
export declare function areaName(code: number): string;
export declare function isZone(code: number): boolean;
export declare function isRegion(code: number): boolean;
/**
 * Does an alert announced for `alertCode` concern a viewer whose location is `locationCode`?
 *
 * This is TVTest-PHL's `DoesEwbsAreaCover()` (`AppMain.cpp`), transcribed, and it is deliberately
 * symmetric: a viewer who selected a whole zone is covered by an alert for a region or city inside
 * that zone, because the alert is inside what they asked to hear about. The allocation is a tree —
 * zone (b11-b9) | region (b8-b5) | city (b4-b0) — so two codes meet when one sits inside the other:
 *
 *   - nationwide covers everyone, and a viewer who selected nationwide is covered by everything;
 *   - different zones never meet;
 *   - within a zone, a zone-level code on either side covers the whole zone;
 *   - within a region, a region-level code on either side covers the region's cities;
 *   - otherwise they are two different cities and do not meet.
 *
 * 0x200 has to be named explicitly: it is a zone code that no city carries the bits of, so no mask
 * finds it, in either direction.
 *
 * The earlier implementation only looked downward (alert above location), which answered "not
 * covered" on 391 of the 19,321 pairs — the reference is symmetric. See `PATCHES.md` C14.
 */
export declare function areaCovers(alertCode: number, locationCode: number): boolean;
/**
 * Should a viewer in `locationCode` see an alert for `alertCode`? The host-facing predicate:
 * location 0 means the receiver has no area set, so everything is shown; otherwise it is
 * `areaCovers()`, which is already symmetric in the reference rule.
 */
export declare function areaRelevant(alertCode: number, locationCode: number): boolean;
//# sourceMappingURL=area_code.d.ts.map