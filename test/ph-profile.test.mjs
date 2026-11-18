// The Philippine profile on real air: an ABS-CBN capture from Panay. Its stylesheet uses the BML
// declarations the PH pages actually ship (resolution, display-aspect-ratio, used-key-list, clut,
// colour indices), which is what makes it the reference fixture for P1/P2.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { decodeTS } from "../dist/server/decode_ts.js";
import { decodeEUCJP } from "../dist/client/charset/euc_jp.js";
import { bmlToXHTMLFXP } from "../dist/client/bml_to_xhtml.js";
import { readCLUT } from "../dist/client/css/clut.js";
import { transpileCSS } from "../dist/client/css/transpile_css.js";
import { aribPNGToPNG } from "../dist/client/media/arib_png.js";
import { fixture as fixturePath, skipWithout } from "./fixture-path.mjs";

const payload = (name) => new Uint8Array(readFileSync(fixturePath(`payloads/${name}`)));

function decodeStream(name) {
    const data = readFileSync(fixturePath(name));
    const messages = [];
    const stream = decodeTS({ sendCallback: (message) => messages.push(message), parsePES: false });
    for (let offset = 0; offset + 188 <= data.length; offset += 188) {
        stream.push(new Uint8Array(data.subarray(offset, offset + 188)));
    }
    return messages;
}

function quietLogger() {
    const lines = [];
    return {
        lines,
        logger: {
            prefix: "", log() { }, debug() { }, info() { }, warn() { },
            error(...args) { lines.push(args.join(" ")); },
        },
    };
}

/** The engine's own clutReader contract: one custom property per palette entry. */
function clutToDeclarations(table) {
    return table.map((rgba, i) => ({
        type: "declaration",
        property: `--clut-color-${i}`,
        value: "#" + rgba.map((v) => v.toString(16).padStart(2, "0")).join(""),
    }));
}

test("the PH capture's BIT names its broadcaster and affiliation", { skip: skipWithout("ph-abs-window.m2ts") }, () => {
    const bit = decodeStream("ph-abs-window.m2ts").find((m) => m.type === "bit");

    assert.notEqual(bit, undefined, "no BIT in the capture");
    assert.equal(bit.originalNetworkId, 8800);
    assert.equal(bit.broadcasters[0].terrestrialBroadcasterId, 1);
    assert.deepEqual(bit.broadcasters[0].affiliations, [8]);
});

test("the PH capture carries three BML carousels beside video and audio", { skip: skipWithout("ph-abs-window.m2ts") }, () => {
    const pmt = decodeStream("ph-abs-window.m2ts").find((m) => m.type === "pmt");

    const carousels = pmt.components.filter((c) => c.streamType === 13).map((c) => c.componentId).sort((a, b) => a - b);
    assert.deepEqual(carousels, [64, 80, 96]);

    const video = pmt.components.find((c) => c.streamType === 27);
    assert.equal(video?.pid, 1111, "H.264 on the PID the PMT declares");
});

test("a real PH page keeps its object and script through the transform", { skip: skipWithout("payloads/page-ph.bml") }, () => {
    const text = decodeEUCJP(payload("page-ph.bml"));

    assert.equal(text.length, 3840);
    assert.match(text, /<object[\s>]/i, "the page embeds an object, so the arib-type rename is exercised");
    assert.match(text, /<script[\s>]/i);

    const html = bmlToXHTMLFXP(text, false);
    assert.match(html, /arib-script/i, "script is renamed for the engine to interpret");
    assert.match(html, /arib-type/i, "object type becomes arib-type");
});

test("a real PH stylesheet transpiles its BML declarations and CLUT", { skip: skipWithout("payloads/style-ph.css", "payloads/bmlclut-ph.bin") }, async () => {
    const { logger } = quietLogger();
    const clut = readCLUT(payload("bmlclut-ph.bin"), logger);
    const css = decodeEUCJP(payload("style-ph.css"));

    assert.equal(css.length, 582);

    const out = await transpileCSS(css, {
        inline: false,
        clutReader: async () => clutToDeclarations(clut),
        convertUrl: (url) => url,
    });

    // The declarations BML pages ship become custom properties the DOM layer reads.
    assert.match(out, /--resolution:\s*720x480/);
    assert.match(out, /--display-aspect-ratio:\s*4v3/);
    assert.match(out, /--used-key-list:\s*basic data-button/);
    assert.match(out, /--clut:\s*url\(/, "the clut declaration becomes a url and is fetched");
    assert.match(out, /--clut-color-0:\s*#000000ff/, "the palette entry reaches the stylesheet as a colour");
});

test("a real PH ARIB PNG decodes at its declared size", { skip: skipWithout("payloads/arib-png-ph.bin", "payloads/bmlclut-ph.bin") }, () => {
    const { logger } = quietLogger();
    const clut = readCLUT(payload("bmlclut-ph.bin"), logger);
    const out = aribPNGToPNG(payload("arib-png-ph.bin"), clut);

    assert.equal(out.width, 77);
    assert.equal(out.height, 23);
    assert.equal(out.data.length, 1884);
});

test("a real PH page script decodes to code", { skip: skipWithout("payloads/script-ph.ecmascript") }, () => {
    const js = decodeEUCJP(payload("script-ph.ecmascript"));

    assert.equal(js.length, 8653);
    assert.match(js, /\bfunction\b/);
    assert.match(js, /DEF_PREMIUM_CHARGEN_NUM/);
});
