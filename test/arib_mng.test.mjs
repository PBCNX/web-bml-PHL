// aribMNGToCSSAnimation builds PNG frames, object URLs and Image elements, so it could not run under
// node --test at all: it threw ReferenceError: Image is not defined. With happy-dom standing in for
// the browser it decodes a real broadcast MNG from the 2024 TBS capture.
//
// Node's own Blob must be kept: URL.createObjectURL accepts only a Node Blob, and happy-dom's Blob is
// a different class ("must be an instance of Blob. Received an instance of Blob").
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Window } from "happy-dom";

import { aribMNGToCSSAnimation } from "../dist/client/media/arib_mng.js";
import { fixture, skipWithout } from "./fixture-path.mjs";
import { defaultCLUT } from "../dist/client/css/default_clut.js";

const window = new Window();
globalThis.window = window;
globalThis.document = window.document;
globalThis.Image = window.Image;
globalThis.CSS = window.CSS;

const payload = (name) => new Uint8Array(readFileSync(fixture(`payloads/${name}`)));

test("a real broadcast MNG becomes a CSS animation", { skip: skipWithout("payloads/image.mng") }, () => {
    const animation = aribMNGToCSSAnimation(payload("image.mng"), defaultCLUT);

    assert.notEqual(animation, null, "the MNG from the capture should decode");
    assert.equal(animation.width, 960);
    assert.equal(animation.height, 5);
    assert.equal(animation.keyframes.length, 20, "one keyframe per frame in the file");
    assert.equal(animation.blobs.length, 20);
    for (const frame of animation.keyframes) {
        // CSS.escape() escapes the colon in the object URL, so the value reads url(blob\:nodedata\:...)
        assert.match(frame.backgroundImage, /^url\(blob/, "each frame points at an object URL");
    }
});

test("a truncated MNG degrades to the frames it did contain", { skip: skipWithout("payloads/image.mng") }, () => {
    // Cut mid-file it returns the frames decoded so far rather than throwing or going null, which is
    // what the <object> path wants: a short animation beats a blank one.
    const truncated = payload("image.mng").subarray(0, 200);
    const animation = aribMNGToCSSAnimation(truncated, defaultCLUT);

    assert.notEqual(animation, null);
    assert.equal(animation.width, 960, "the header still describes the canvas");
    assert.ok(animation.keyframes.length < 20, "but not every frame arrived");
});

test("garbage that is not an MNG also answers null", () => {
    assert.equal(aribMNGToCSSAnimation(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), defaultCLUT), null);
});
