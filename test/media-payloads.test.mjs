// The ARIB media decoders were only ever tested against synthetic buffers. These payloads are
// extracted from a real BS-TBS (Japan, 2023-01-15) broadcast: the demuxer pulled them out of module
// bodies, and they are the exact bytes the engine's <object> path hands to each decoder.
//
// Regenerating them: feed the capture to decodeTS, collect moduleDownloaded[].files, and write each
// file's dataBase64 out by content subtype.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { readCLUT } from "../dist/client/css/clut.js";
import { aribPNGToPNG } from "../dist/client/media/arib_png.js";
import { decodeEUCJP } from "../dist/client/charset/euc_jp.js";
import { bmlToXHTMLFXP } from "../dist/client/bml_to_xhtml.js";
import { transpileCSS } from "../dist/client/css/transpile_css.js";
import { fixture as fixturePath, skipWithout } from "./fixture-path.mjs";

const payload = (name) => new Uint8Array(readFileSync(fixturePath(`payloads/${name}`)));

function quietLogger() {
    const lines = [];
    return {
        lines,
        logger: {
            prefix: "",
            log() { },
            debug() { },
            info() { },
            warn() { },
            error(...args) { lines.push(args.join(" ")); },
        },
    };
}

test("a real broadcast CLUT decodes to a usable palette", { skip: skipWithout("payloads/bmlclut.bin") }, () => {
    // 387 bytes: clut_type/depth/flags, one byte range, then entries. readCLUT fills a 256-entry table.
    const { table, logger } = { ...quietLogger(), table: null };
    void table;
    const { logger: log } = quietLogger();
    const clut = readCLUT(payload("bmlclut.bin"), log);

    assert.equal(clut.length, 256, "a readable CLUT is the full 256-entry table");
    assert.equal(clut.filter((e) => e.some((v) => Number.isNaN(v))).length, 0, "no NaN colours from real data");
    assert.deepEqual(clut[0], [0, 0, 0, 255]);
});

test("a real ARIB PNG becomes a real PNG at its declared size", { skip: skipWithout("payloads/bmlclut.bin", "payloads/arib-png.bin") }, () => {
    const { logger } = quietLogger();
    const clut = readCLUT(payload("bmlclut.bin"), logger);
    const out = aribPNGToPNG(payload("arib-png.bin"), clut);

    assert.equal(out.width, 90);
    assert.equal(out.height, 30);
    assert.equal(out.data.length, 1499);
    // PNG magic: 89 50 4E 47
    assert.deepEqual(Array.from(out.data.subarray(0, 4)), [0x89, 0x50, 0x4e, 0x47]);
});

test("a real broadcast BML document decodes and survives the transform", { skip: skipWithout("payloads/page-bs.bml") }, () => {
    // Declared text/x-arib-bml; charset=euc-jp, from a BS (Japanese) carousel.
    const text = decodeEUCJP(payload("page-bs.bml"));

    // 11,868 bytes of EUC-JP decode to 11,681 characters: multibyte sequences collapse.
    assert.equal(text.length, 11681);
    assert.match(text, /<bml[\s>]/i);

    const html = bmlToXHTMLFXP(text, false);
    assert.match(html, /<body[\s>]/i);
});

test("the capture's custom sound is a real compressed AIFF", { skip: skipWithout("payloads/custom-sound.aifc") }, () => {
    // BML "custom sound": FORM/AIFC. Decoding it needs an AudioNode, so what is pinned here is that
    // the module really carries one and that its container is intact — a shape the demuxer must
    // preserve byte for byte.
    const bytes = payload("custom-sound.aifc");

    assert.equal(Buffer.from(bytes.subarray(0, 4)).toString("latin1"), "FORM");
    assert.equal(Buffer.from(bytes.subarray(8, 12)).toString("latin1"), "AIFC");
    assert.equal(bytes.length, 96086);

    const declared = (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7];
    assert.equal(declared, bytes.length - 8, "the FORM length must match the file, so nothing was truncated");
});
// The remaining payloads come from a 2024 TBS drama episode, the richest capture available: nine
// BML carousels and modules for MNG, ECMAScript, CSS and a root certificate.

test("a real broadcast stylesheet transpiles with its Japanese font and CLUT colours", { skip: skipWithout("payloads/bmlclut.bin", "payloads/style.css") }, async () => {
    const { logger } = quietLogger();
    const clut = readCLUT(payload("bmlclut.bin"), logger);
    const css = decodeEUCJP(payload("style.css"));

    assert.equal(css.length, 1558, "the module is EUC-JP, not UTF-8");

    const out = await transpileCSS(css, {
        inline: false,
        clutReader: async () => clut,
        convertUrl: (url) => url,
    });

    assert.match(out, /font-family:\s*"丸ゴシック"/, "the declared Japanese face must survive decoding");
    assert.match(out, /--clut-color-17/, "a colour index becomes a CLUT variable");
    assert.ok(out.length > css.length, "transpiling expands rather than truncates");
});

test("a real broadcast ECMAScript module decodes to its source", { skip: skipWithout("payloads/script.ecmascript") }, () => {
    // The engine treats these as arib-script bodies, so the bytes must decode cleanly.
    const js = decodeEUCJP(payload("script.ecmascript"));

    assert.equal(js.trim(), "var XTD_gECMALoadedFlg=true;");
});

test("a real golden-page document decodes and transforms", { skip: skipWithout("payloads/page-golden.bml") }, () => {
    const text = decodeEUCJP(payload("page-golden.bml"));

    assert.equal(text.length, 1460);
    assert.match(text, /<bml[\s>]/i);
    assert.match(bmlToXHTMLFXP(text, false), /<body[\s>]/i);
});

test("the capture carries a DER root certificate the engine currently ignores", { skip: skipWithout("payloads/root-certificate.der") }, () => {
    // getRootCertificateInfo() is a stub returning [], so what is pinned is that the stream really
    // does deliver certificates — the fixture that would exercise a real implementation.
    const der = payload("root-certificate.der");

    assert.equal(der[0], 0x30, "a DER structure starts with a SEQUENCE");
    assert.equal(der[1], 0x82, "and declares a two-byte length here");
    const declared = (der[2] << 8) | der[3];
    assert.equal(declared, der.length - 4, "the DER length must match the extracted bytes");
});

test("the second custom sound is also a complete AIFC", { skip: skipWithout("payloads/custom-sound2.aifc") }, () => {
    const bytes = payload("custom-sound2.aifc");

    assert.equal(Buffer.from(bytes.subarray(0, 4)).toString("latin1"), "FORM");
    assert.equal(Buffer.from(bytes.subarray(8, 12)).toString("latin1"), "AIFC");
    const declared = (bytes[4] << 24) | (bytes[5] << 16) | (bytes[6] << 8) | bytes[7];
    assert.equal(declared, bytes.length - 8);
});
test("a substantial page script decodes to real code", { skip: skipWithout("payloads/script-large.ecmascript") }, () => {
    // 7,247 bytes from the golden capture: the page's own logic, not a flag setter.
    const js = decodeEUCJP(payload("script-large.ecmascript"));

    assert.equal(js.length, 6879);
    assert.match(js, /TBS GLOWDIA/, "the module carries its copyright header");
    assert.match(js, /\bfunction\b/, "and real function definitions");
});