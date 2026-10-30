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

function nvramFor(profile) {
    const resources = new Resources(undefined, {}, logger);
    // private in TypeScript, a plain field at runtime
    resources._profile = profile;
    // the identity checks read the program info; a receiver that never saw one has no ids
    resources.currentProgramInfo = { type: "programInfo", originalNetworkId: 4, transportStreamId: 1, serviceId: 1 };
    return new NVRAM(resources, broadcasterDatabase, logger, "nvram_", {});
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
    assert.ok(Number.isNaN(nvramFor(Profile.BS).checkAccessInfoOfPersistentArray("nvram://tr_common/0")));
});
