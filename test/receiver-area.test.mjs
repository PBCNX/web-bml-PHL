// 2.5.0: the receiver's area code lives in nvram://receiverinfo/regioncode as a big-endian 16-bit
// field whose low 12 bits are the Philippine EWBS allocation. 0 and absent both mean "unset".
import test from "node:test";
import assert from "node:assert/strict";

import { regionCodeFromBytes } from "../dist/client/nvram/nvram.js";
import { areaByCode, isRegion, isZone } from "../dist/client/area_code.js";

test("the field is big-endian and 12 bits", () => {
    assert.equal(regionCodeFromBytes(Uint8Array.from([0x04, 0x20])), 0x420);
    assert.equal(regionCodeFromBytes(Uint8Array.from([0x0f, 0xe0])), 0xfe0); // masked to 12 bits
    assert.equal(regionCodeFromBytes(Uint8Array.from([0x00, 0x00])), null);
    assert.equal(regionCodeFromBytes(Uint8Array.from([0x00])), null);
    assert.equal(regionCodeFromBytes(null), null);
});

test("a PH code resolves to its zone and region names", () => {
    // 0x421 Caloocan -> region 0x420 NCR -> zone 0x400 Luzon
    const code = 0x421;
    assert.equal(isZone(code), false);
    assert.equal(isRegion(code), false);
    assert.equal(areaByCode(code)?.name, "Caloocan");
    assert.equal(areaByCode(code & 0xfe0)?.name, "NCR");
    assert.equal(areaByCode(code & 0xe00)?.name, "Luzon");
});
