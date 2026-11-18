// 3.1.x: the Japanese receiver-location set. The PH setter (2.6.0) always writes a PH combination;
// a JP page needs the postal code and prefecture instead, and the two sets must never mix. This pairs
// with receiver-area-write.test.mjs: that one proves a PH code overwrites leftover Japanese fields,
// this one proves a Japanese set clears a leftover PH code.
import test from "node:test";
import assert from "node:assert/strict";

import { NVRAM, receiverPostalCodeSet } from "../dist/client/nvram/nvram.js";
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
const ZIP = "nvram_prefix=receiverinfo%2Fzipcode";
const PREF = "nvram_prefix=receiverinfo%2Fprefecture";
const REGION = "nvram_prefix=receiverinfo%2Fregioncode";

test("a Japanese set writes the postal code, the prefecture and no region code", () => {
    const { nvram, store } = withStorage();

    assert.equal(nvram.setReceiverPostalCode("1350047", 13), true);
    assert.equal(store.get(ZIP), b64([1, 3, 5, 0, 0, 4, 7]));
    assert.equal(store.get(PREF), b64([13]));
    // An unset fixed field reads as zeroes, so "regioncode 0" needs no write at all; what matters is
    // that no Philippine code is left behind.
    assert.equal(nvram.getReceiverAreaCode(), null);
    assert.deepEqual(nvram.getReceiverPostalCode(), { postcode: "1350047", prefecture: 13, japanLocationCode: null });
});

test("the same set again writes nothing", () => {
    const { nvram } = withStorage();

    nvram.setReceiverPostalCode("1350047", 13);
    assert.equal(nvram.setReceiverPostalCode("1350047", 13), false);
});

test("a hyphenated postal code is accepted, because hosts format it that way", () => {
    const { nvram } = withStorage();

    assert.equal(nvram.setReceiverPostalCode("135-0047", 13), true);
    assert.equal(nvram.getReceiverPostalCode()?.postcode, "1350047");
});

test("a Japanese set clears a stale Philippine region code", () => {
    const { nvram, store } = withStorage();
    nvram.setReceiverAreaCode(0x42b); // Pasay, left over from a PH stream
    assert.notEqual(store.get(REGION), b64([0, 0]));

    assert.equal(nvram.setReceiverPostalCode("1350047", 13), true);
    assert.equal(store.get(REGION), b64([0, 0]), "the PH code must not survive a Japanese set");
    assert.equal(nvram.getReceiverAreaCode(), null);
});

test("a Philippine set clears the Japanese postal fields, and the Japanese getter says so", () => {
    const { nvram, store } = withStorage();
    nvram.setReceiverPostalCode("1350047", 13);

    assert.equal(nvram.setReceiverAreaCode(0x42b), true);
    assert.equal(store.get(ZIP), b64([0, 0, 0, 0, 0, 0, 0]));
    assert.equal(store.get(PREF), b64([0xff]));
    assert.equal(nvram.getReceiverPostalCode(), null, "a PH set holds no Japanese location");
});

test("bad input is refused and nothing is written", () => {
    const { nvram, store } = withStorage();

    assert.equal(nvram.setReceiverPostalCode("135004", 13), false, "6 digits");
    assert.equal(nvram.setReceiverPostalCode("1350047", 0), false, "prefecture 0");
    assert.equal(nvram.setReceiverPostalCode("1350047", 99), false, "prefecture 99");
    assert.equal(store.size, 0, "a refused call must not touch NVRAM");
});

test("the Japanese location code is kept when the host has one, 12-bit", () => {
    const { nvram } = withStorage();

    assert.equal(nvram.setReceiverPostalCode("1350047", 13, 0x1fed), true);
    assert.equal(nvram.getReceiverPostalCode()?.japanLocationCode, 0xfed, "the field is 12 bits");
    assert.deepEqual([...receiverPostalCodeSet("1350047", 13, 0x1fed).regionCode], [0x0f, 0xed]);
});
