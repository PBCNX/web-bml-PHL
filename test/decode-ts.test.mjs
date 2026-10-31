// web-bml/ts is a published entry point and had no test at all: every earlier attempt built
// synthetic 188-byte packets and never reached the reader's tot listener. These two fixtures are
// 8000-packet windows cut from real captures around their first TOT, so the demuxer sees genuine
// PAT/PMT/TOT framing.
//
//   ph-gma-window.m2ts — GMA Network (Philippines), 2023-09-14, BML carousel on component 96
//   jp-tbs-window.m2ts — TBS (Japan), 2012-06-28, the A-profile counterpart
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { decodeTS } from "../dist/server/decode_ts.js";
import { decodeEUCJP } from "../dist/client/charset/euc_jp.js";
import { bmlToXHTMLFXP } from "../dist/client/bml_to_xhtml.js";
import { fixture as fixturePath, skipWithout } from "./fixture-path.mjs";

const fixture = (name) => readFileSync(fixturePath(name));

function decode(name) {
    const data = fixture(name);
    const messages = [];
    const stream = decodeTS({ sendCallback: (message) => messages.push(message), parsePES: false });
    for (let offset = 0; offset + 188 <= data.length; offset += 188) {
        stream.push(new Uint8Array(data.subarray(offset, offset + 188)));
    }
    return messages;
}

const byType = (messages, type) => messages.filter((m) => m.type === type);

test("the PH capture yields its TOT as a currentTime with the offset the stream declares", { skip: skipWithout("ph-gma-window.m2ts") }, () => {
    const time = byType(decode("ph-gma-window.m2ts"), "currentTime")[0];

    assert.notEqual(time, undefined, "no currentTime came out of the TOT");
    // The TOT's field is the broadcast local time (PH standard Table 35: Filipino official time,
    // UTC+8; Table 36 deletes the offset descriptor). The capture says 15:24:22, so the page must
    // display 15:24:22 — the old JST conversion displayed 14:24.
    assert.equal(time.timeUnixMillis, 1694705062000); // the field verbatim: 15:24:22
    assert.equal(time.localTimeOffsetMinutes, 480);
    assert.equal(new Date(time.timeUnixMillis + 480 * 60000).toISOString(), "2023-09-14T23:24:22.000Z"); // the box adds +8
});

test("the JP capture omits the offset because its TOT has no descriptor", { skip: skipWithout("jp-tbs-window.m2ts") }, () => {
    const time = byType(decode("jp-tbs-window.m2ts"), "currentTime")[0];

    assert.notEqual(time, undefined);
    assert.equal(time.timeUnixMillis, 1340904594000);
    assert.equal("localTimeOffsetMinutes" in time, false, "an absent descriptor must not be invented as 0");
});

test("the PH PMT names the BML carousel and the video component", { skip: skipWithout("ph-gma-window.m2ts") }, () => {
    const pmt = byType(decode("ph-gma-window.m2ts"), "pmt")[0];

    assert.notEqual(pmt, undefined, "no pmt came out of the PAT/PMT pair");
    const bml = pmt.components.find((c) => c.componentId === 96);
    assert.notEqual(bml, undefined, "the BML component is missing");
    assert.equal(bml.pid, 1026);
    assert.equal(bml.streamType, 13, "stream type 13 is the data carousel");
    assert.equal(bml.bxmlInfo?.additionalAribCarouselInfo?.dataEventId, 15);

    const video = pmt.components.find((c) => c.componentId === 0);
    assert.equal(video?.streamType, 27, "stream type 27 is H.264");
});

test("the PH capture lists a module for the carousel with its real size", { skip: skipWithout("ph-gma-window.m2ts") }, () => {
    const list = byType(decode("ph-gma-window.m2ts"), "moduleListUpdated").find((m) => m.componentId === 96);

    assert.notEqual(list, undefined, "no module list for the BML component");
    assert.equal(list.modules.length, 1);
    assert.equal(list.modules[0].size, 38474, "the module size comes from the DII, not a guess");
});

test("the PH capture reports the service the carousel belongs to", { skip: skipWithout("ph-gma-window.m2ts") }, () => {
    const info = byType(decode("ph-gma-window.m2ts"), "programInfo")[0];

    assert.equal(info?.serviceId, 96);
});

test("both captures emit only message types the protocol declares", { skip: skipWithout("ph-gma-window.m2ts", "jp-tbs-window.m2ts") }, () => {
    const known = new Set([
        "pcr", "pmt", "pat", "bit", "tot", "programInfo", "currentTime", "moduleListUpdated",
        "moduleDownloaded", "esEventUpdated", "videoStreamUrl", "pes", "error", "emergencyInfo",
    ]);
    for (const name of ["ph-gma-window.m2ts", "jp-tbs-window.m2ts"]) {
        for (const message of decode(name)) {
            assert.ok(known.has(message.type), `${name} emitted an unknown type: ${message.type}`);
        }
    }
});
test("a real PH module carries the page through the demuxer, the codec and the transform", { skip: skipWithout("ph-gma-window.m2ts") }, () => {
    // The whole published chain, on broadcast data: /ts extracts the module, our EUC-JP codec
    // decodes its declared charset, and the transform produces the markup the DOM layer parses.
    const files = decode("ph-gma-window.m2ts")
        .filter((m) => m.type === "moduleDownloaded")
        .flatMap((m) => m.files ?? []);
    const bml = files.find((f) => f.contentType?.subtype?.toLowerCase() === "x-arib-bml");

    assert.notEqual(bml, undefined, "no BML module in the capture");
    assert.equal(bml.contentType.parameters.find((p) => p.attribute === "charset")?.value, "euc-jp");

    const bytes = new Uint8Array(Buffer.from(bml.dataBase64, "base64"));
    const text = decodeEUCJP(bytes);
    assert.equal(text.length, 4243, "the decoded document length is the module's declared size");
    assert.match(text, /<bml[\s>]/i);
    assert.match(text, /<body[\s>]/i);

    const html = bmlToXHTMLFXP(text, false);
    assert.match(html, /<body[\s>]/i, "the transform must keep the page body");
    assert.match(html, /arib-script/i, "a <script in the broadcast document becomes arib-script");
});

test("the PH module also ships a JPEG object and a resource list", { skip: skipWithout("ph-gma-window.m2ts") }, () => {
    const files = decode("ph-gma-window.m2ts")
        .filter((m) => m.type === "moduleDownloaded")
        .flatMap((m) => m.files ?? []);

    const jpeg = files.find((f) => f.contentType?.subtype === "jpeg");
    assert.notEqual(jpeg, undefined, "the capture carries no JPEG object");
    const bytes = Buffer.from(jpeg.dataBase64, "base64");
    assert.equal(bytes[0], 0xff, "a JPEG starts with FF D8");
    assert.equal(bytes[1], 0xd8);

    const resourceList = files.find((f) => f.contentType?.subtype?.toLowerCase() === "x-arib-resourcelist");
    assert.notEqual(resourceList, undefined, "the module must declare its resource list");
    assert.ok(Buffer.from(resourceList.dataBase64, "base64").length > 0);
});
test("the TV5 capture declares +8h, so a PH stream can carry the offset the notes recorded", { skip: skipWithout("ph-tv5-window.m2ts") }, () => {
    // Three PH/JP streams, three different answers, which is why the host override exists:
    //   GMA  declares +0      TV5 declares +480      TBS declares nothing
    const time = byType(decode("ph-tv5-window.m2ts"), "currentTime")[0];

    assert.notEqual(time, undefined, "no currentTime from the TV5 TOT");
    assert.equal(time.localTimeOffsetMinutes, 480);
});

test("the TV5 PMT lists its two BML carousels", { skip: skipWithout("ph-tv5-window.m2ts") }, () => {
    const pmt = byType(decode("ph-tv5-window.m2ts"), "pmt")[0];
    const carousels = pmt.components.filter((c) => c.streamType === 13).map((c) => c.componentId).sort((a, b) => a - b);

    assert.deepEqual(carousels, [64, 80]);
});