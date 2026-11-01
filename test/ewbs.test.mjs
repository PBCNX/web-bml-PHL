// EWBS: the engine could decide alert relevance (areaCovers/areaRelevant, P2) but never learned the
// areas from the air — the demuxer dropped the emergency_information_descriptor. These tests pin the
// mapping, and the Philippine area semantics it is paired with.
//
// Honest limit: no capture in hand carries that descriptor. The PH EWBS recording
// ("DTVph-EWBS-CountryWide", 966 MB) was scanned end to end and yields no emergencyInfo message, so
// PH EWBS plainly does not signal through this descriptor — the alert is the broadcast itself.
import test from "node:test";
import assert from "node:assert/strict";

import { readFileSync } from "node:fs";
import { fixture as fixturePath, skipWithout } from "./fixture-path.mjs";
import { join } from "node:path";

import { decodeTS, emergencyInfoMessages } from "../dist/server/decode_ts.js";
import { areaCovers, areaRelevant } from "../dist/client/area_code.js";

test("an emergency descriptor becomes one message per service area", () => {
    const messages = emergencyInfoMessages(1062, {
        tag: "emergencyInformation",
        services: [{ startEndFlag: true, signalLevel: true, areaCodes: [0x400, 0x420] }],
    });

    assert.equal(messages.length, 1);
    assert.deepEqual(messages[0], {
        type: "emergencyInfo",
        serviceId: 1062,
        startEndFlag: true,
        signalLevel: true,
        areaCodes: [0x400, 0x420],
    });
});

test("a descriptor of another tag yields nothing", () => {
    // The service list descriptor also has `services`, so the tag must be checked first.
    assert.deepEqual(emergencyInfoMessages(1, { tag: "serviceList", services: [{ serviceId: 1 }] }), []);
    assert.deepEqual(emergencyInfoMessages(1, null), []);
    assert.deepEqual(emergencyInfoMessages(1, { tag: "emergencyInformation" }), []);
});

test("a Luzon-wide alert covers Manila, which is what P2 decides", () => {
    // 0x400 Luzon (zone 0x400) covers 0x426 Manila (region 0x420) — a real pair from the table.
    const [alert] = emergencyInfoMessages(1062, {
        tag: "emergencyInformation",
        services: [{ startEndFlag: true, signalLevel: true, areaCodes: [0x400] }],
    });

    assert.equal(alert.areaCodes[0], 0x400);
    assert.equal(areaCovers(alert.areaCodes[0], 0x426), true, "a viewer in Manila is covered");
    assert.equal(areaRelevant(alert.areaCodes[0], 0x426), true);
    assert.equal(areaCovers(alert.areaCodes[0], 0x426), true, "and the reverse direction agrees");
});

test("an exact city alert covers only that city", () => {
    const [alert] = emergencyInfoMessages(1062, {
        tag: "emergencyInformation",
        services: [{ startEndFlag: false, signalLevel: false, areaCodes: [0x426] }],
    });

    assert.equal(areaCovers(alert.areaCodes[0], 0x426), true, "Manila covers itself");
    // A viewer who selected the whole zone is inside what the alert is about, so they are covered;
    // a viewer in another zone is not.
    assert.equal(areaCovers(alert.areaCodes[0], 0x400), true, "a zone viewer is covered by an alert inside it");
    assert.equal(areaCovers(alert.areaCodes[0], 0x621), false, "a city in another zone is not covered");
});
// The descriptor is a PMT program_info descriptor, not an SDT one. A window cut from PBCNX's own
// EWBS end-to-end stream (e2e_B, built by their injector) is the proof: the engine now surfaces it.
function decodeWindow(name) {
    const data = readFileSync(fixturePath(name));
    const messages = [];
    const stream = decodeTS({ sendCallback: (message) => messages.push(message), parsePES: false });
    for (let offset = 0; offset + 188 <= data.length; offset += 188) {
        stream.push(new Uint8Array(data.subarray(offset, offset + 188)));
    }
    return messages;
}

test("a real EWBS stream surfaces its alert from the PMT program_info descriptor", { skip: skipWithout("ph-ewbs-window.m2ts") }, () => {
    const alerts = decodeWindow("ph-ewbs-window.m2ts").filter((m) => m.type === "emergencyInfo");

    // The PMT repeats every few hundred ms; the same alert must be reported once, not once per PMT.
    assert.equal(alerts.length, 1, "the alert should be emitted once for the whole window");
    assert.ok(alerts.length > 0, "no emergencyInfo came out of a stream that carries one");
    for (const alert of alerts) {
        assert.equal(alert.serviceId, 1);
        assert.equal(alert.startEndFlag, true, "the alert is starting");
        assert.equal(alert.signalLevel, false, "the compliant signal level is 0");
        assert.deepEqual(alert.areaCodes, [0x427], "Marikina, as the injector wrote it");
    }
});

test("Marikina's alert reaches Marikina and not Manila", { skip: skipWithout("ph-ewbs-window.m2ts") }, () => {
    const [alert] = decodeWindow("ph-ewbs-window.m2ts").filter((m) => m.type === "emergencyInfo");
    const code = alert.areaCodes[0];

    assert.equal(areaCovers(code, 0x427), true, "a Marikina viewer is covered");
    assert.equal(areaCovers(code, 0x426), false, "a Manila viewer is not — they are different cities");
    assert.equal(areaCovers(0x420, code), true, "the NCR region code would cover it");
});

test("the same stream carries the alert page as a module", { skip: skipWithout("ph-ewbs-window.m2ts") }, () => {
    // PBCNX's EWBS app ships alert.bml at /50/2000, so the stream is self-contained.
    const files = decodeWindow("ph-ewbs-window.m2ts")
        .filter((m) => m.type === "moduleDownloaded")
        .flatMap((m) => m.files ?? []);

    const bml = files.find((f) => f.contentType?.subtype?.toLowerCase() === "x-arib-bml");
    assert.notEqual(bml, undefined, "the alert page is missing from the stream");
    assert.ok(Buffer.from(bml.dataBase64, "base64").length > 0);
});