// 2.6.2: a call with the same code writes nothing at all, so a page's own zipcode survives a host that
// re-asserts the same location on every load. A change of code replaces the whole set.
import test from "node:test";
import assert from "node:assert/strict";

import { NVRAM } from "../dist/client/nvram/nvram.js";
import { Resources } from "../dist/client/resource.js";

const logger = { prefix: "", log() { }, debug() { }, info() { }, warn() { }, error() { } };
const db = { getBroadcasterId: () => null, getAffiliationIdList: () => null };

function withStorage(seed = {}) {
    const store = new Map(Object.entries(seed));
    globalThis.localStorage = {
        getItem: (k) => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => store.set(k, String(v)),
        removeItem: (k) => store.delete(k),
        clear: () => store.clear(),
    };
    globalThis.window = {
        btoa: (s) => Buffer.from(s, "binary").toString("base64"),
        atob: (s) => Buffer.from(s, "base64").toString("binary"),
    };
    const resources = new Resources(undefined, {}, logger);
    resources._profile = "A";
    resources.currentProgramInfo = { type: "programInfo", originalNetworkId: 4, transportStreamId: 1, serviceId: 1 };
    return { nvram: new NVRAM(resources, db, logger, "nvram_", {}), store };
}

const b64 = (bytes) => Buffer.from(Uint8Array.from(bytes)).toString("base64");

test("a same-code call leaves a page's zipcode alone", () => {
    const { nvram, store } = withStorage();
    nvram.setReceiverAreaCode(0x421);
    // a page writes its own zipcode afterwards
    const pageZip = b64([7, 7, 7, 7, 7, 7, 7]);
    store.set("nvram_prefix=receiverinfo%2Fzipcode", pageZip);
    assert.equal(nvram.setReceiverAreaCode(0x421), false, "same code: nothing written");
    assert.equal(store.get("nvram_prefix=receiverinfo%2Fzipcode"), pageZip, "the page write survives");
});

test("a changed code still replaces the whole set", () => {
    const { nvram, store } = withStorage();
    nvram.setReceiverAreaCode(0x421);
    store.set("nvram_prefix=receiverinfo%2Fzipcode", b64([7, 7, 7, 7, 7, 7, 7]));
    assert.equal(nvram.setReceiverAreaCode(0x426), true);
    assert.equal(nvram.getReceiverAreaCode(), 0x426);
    assert.equal(store.get("nvram_prefix=receiverinfo%2Fzipcode"), b64([0, 0, 0, 0, 0, 0, 0]));
});
