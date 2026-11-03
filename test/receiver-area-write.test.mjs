// 2.6.0: a host sets the receiver-info set as one — regioncode plus prefecture 255 and an empty
// zipcode — so a PH code can never coexist with leftover Japanese postal fields, and nothing is
// written when the stored set already matches.
import test from "node:test";
import assert from "node:assert/strict";

import { NVRAM, receiverAreaCodeSet } from "../dist/client/nvram/nvram.js";
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

test("a PH code overwrites leftover Japanese postal fields", () => {
    const { nvram, store } = withStorage({
        "nvram_prefix=receiverinfo%2Fprefecture": b64([0x0d]),            // a Japanese prefecture
        "nvram_prefix=receiverinfo%2Fzipcode": b64([1, 2, 3, 4, 5, 6, 7]), // a Japanese postal code
    });
    assert.equal(nvram.setReceiverAreaCode(0x421), true);
    assert.equal(nvram.getReceiverAreaCode(), 0x421);
    assert.equal(store.get("nvram_prefix=receiverinfo%2Fprefecture"), b64([0xff]));
    assert.equal(store.get("nvram_prefix=receiverinfo%2Fzipcode"), b64([0, 0, 0, 0, 0, 0, 0]));
});

test("an unchanged set writes nothing", () => {
    const { nvram } = withStorage();
    nvram.setReceiverAreaCode(0x421);
    assert.equal(nvram.setReceiverAreaCode(0x421), false, "a second call must not touch NVRAM");
});

test("null and 0 clear the code but keep the PH set", () => {
    const { nvram } = withStorage();
    nvram.setReceiverAreaCode(0x421);
    assert.equal(nvram.setReceiverAreaCode(null), true);
    assert.equal(nvram.getReceiverAreaCode(), null);
    assert.equal(nvram.setReceiverAreaCode(0), false, "0 is already the cleared value");
});

test("the encoded set masks to 12 bits", () => {
    assert.deepEqual([...receiverAreaCodeSet(0x1fed).regionCode], [0x0f, 0xed]);
    assert.deepEqual([...receiverAreaCodeSet(null).regionCode], [0, 0]);
    assert.deepEqual([...receiverAreaCodeSet(0x421).prefecture], [0xff]);
    assert.deepEqual([...receiverAreaCodeSet(0x421).zipcode], [0, 0, 0, 0, 0, 0, 0]);
});
