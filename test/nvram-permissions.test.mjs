// The NVRAM permission table has one row per broadcast type, and the receiver's own type selects
// it. Before this was enforced, the first (GR) row answered for every receiver, so BS and CS were
// denied areas their own row grants.
import test from "node:test";
import assert from "node:assert/strict";

import { NVRAM } from "../dist/client/nvram/nvram.js";
import { Resources } from "../dist/client/resource.js";
import { Profile } from "../dist/client/profile.js";

const logger = {
    prefix: "",
    log() { },
    debug() { },
    info() { },
    warn() { },
    error() { },
};

const broadcasterDatabase = {
    getBroadcasterId: () => null,
    getAffiliationIdList: () => null,
};

function nvramFor(profile, db = broadcasterDatabase) {
    const resources = new Resources(undefined, {}, logger);
    // private in TypeScript, a plain field at runtime
    resources._profile = profile;
    // the identity checks read the program info; a receiver that never saw one has no ids
    resources.currentProgramInfo = { type: "programInfo", originalNetworkId: 4, transportStreamId: 1, serviceId: 1 };
    return new NVRAM(resources, db, logger, "nvram_", {});
}

test("a BS receiver gets the BS local_web row, which is read/write", () => {
    assert.equal(nvramFor(Profile.BS).checkAccessInfoOfPersistentArray("nvram://local_web/0"), 2);
});

test("a CS receiver gets the CS local_web row, which is read/write", () => {
    assert.equal(nvramFor(Profile.CS).checkAccessInfoOfPersistentArray("nvram://local_web/0"), 2);
});

test("a terrestrial receiver gets the GR local_web row, which is read/write", () => {
    assert.equal(nvramFor(Profile.TrProfileA).checkAccessInfoOfPersistentArray("nvram://local_web/0"), 2);
});

test("cs_common is CS-only: read/write for CS, no such area for BS and terrestrial", () => {
    assert.equal(nvramFor(Profile.CS).checkAccessInfoOfPersistentArray("nvram://cs_common/0"), 2);
    // The table has no cs_common row for these receivers, so the area is unknown to them (NaN),
    // which the scheme reports differently from an area that exists but is denied (0).
    assert.ok(Number.isNaN(nvramFor(Profile.BS).checkAccessInfoOfPersistentArray("nvram://cs_common/0")));
    assert.ok(Number.isNaN(nvramFor(Profile.TrProfileA).checkAccessInfoOfPersistentArray("nvram://cs_common/0")));
});

test("a prefix this receiver has no row for is unknown, not denied", () => {
    // NaN = no such area (the URL names nothing this receiver knows); 0 would mean "the area exists
    // and you may not touch it".
    assert.ok(Number.isNaN(nvramFor(Profile.BS).checkAccessInfoOfPersistentArray("nvram://no_such_area/0")));
    // tr_common is BS read-only per documents/nvram.md (BS 読み出し, CS 不可, 地上 読み書き) - before the
    // permission-based match the type filter hid it from BS and this test called that "unknown".
    assert.equal(nvramFor(Profile.BS).checkAccessInfoOfPersistentArray("nvram://tr_common/0"), 1);
    assert.ok(Number.isNaN(nvramFor(Profile.CS).checkAccessInfoOfPersistentArray("nvram://tr_common/0")));
});

// Measured on BS-TBS (2026-11-01): the page reads `nvram:///03/group/30` - the affiliation as a path
// segment - and the engine answered "findNvramArea failed". The grammar form `03;group/30` works; both
// must name the same area.
test("the affiliation may be a path segment, as BS-TBS writes it", () => {
    // BS-TBS is TBS, affiliation 03; a real receiver knows its own affiliation list.
    const tbs = nvramFor(Profile.BS, { getBroadcasterId: () => null, getAffiliationIdList: () => [3] });
    assert.equal(tbs.checkAccessInfoOfPersistentArray("nvram://03;group/30"), 2);
    assert.equal(tbs.checkAccessInfoOfPersistentArray("nvram:///03/group/30"), 2,
        "the path form must resolve to the same group area");
    // A path segment that names no affiliation is not silently accepted as a prefix.
    assert.ok(Number.isNaN(tbs.checkAccessInfoOfPersistentArray("nvram:///zz/group/30")));
});