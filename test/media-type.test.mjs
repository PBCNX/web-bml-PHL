import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultCSS } from "../dist/client/css/default_css.js";

import {
    findVideoElement,
    isAiffMediaType,
    isAudioMediaType,
    isComponentAudioMediaType,
    isVideoMediaType,
} from "../dist/client/media/media_type.js";

// C11/C12: the PH profile replaces the audio and video component types (AP8-1 §5.7.3, §5.11). The
// engine keeps both, and every comparison now goes through these helpers rather than one literal.

test("the PH media types are recognised, and so are the Japanese ones", () => {
    assert.equal(isComponentAudioMediaType("audio/X-arib-mpeg4-aac"), true, "PH audio");
    assert.equal(isComponentAudioMediaType("audio/x-arib-mpeg2-aac"), true, "Japanese audio, case-insensitive");
    assert.equal(isComponentAudioMediaType("audio/X-arib-aiff"), false, "AIFF is a clip, not a stream");
    assert.equal(isAiffMediaType("audio/X-arib-aiff"), true);
    assert.equal(isAudioMediaType("audio/X-arib-mpeg4-aac"), true);
    assert.equal(isAudioMediaType("audio/X-arib-aiff"), true);
    assert.equal(isAudioMediaType("audio/mp4"), false);
    assert.equal(isAudioMediaType(null), false);

    assert.equal(isVideoMediaType("video/X-arib-H264-high"), true, "PH video");
    assert.equal(isVideoMediaType("video/x-arib-h264-high"), true, "case-insensitive");
    assert.equal(isVideoMediaType("video/X-arib-mpeg2"), true, "Japanese video");
    assert.equal(isVideoMediaType("video/mp4"), false);
    assert.equal(isVideoMediaType(undefined), false);
});

test("the video plane is found by type, not by one literal", () => {
    // A minimal fake: the selector only needs querySelectorAll and getAttribute.
    const element = (attributes) => ({
        getAttribute: (name) => attributes[name] ?? null,
    });
    const root = (elements) => ({
        querySelectorAll: (selector) => {
            const attribute = /object\[([^\]]+)\]/.exec(selector)?.[1];
            return elements.filter((el) => el.getAttribute(attribute) != null);
        },
    });

    const ph = root([element({ type: "video/X-arib-H264-high" })]);
    assert.equal(findVideoElement(ph), ph.querySelectorAll("object[type]")[0], "a PH page's video plane is found");

    const jp = root([element({ "arib-type": "video/X-arib-mpeg2" })]);
    assert.equal(findVideoElement(jp), jp.querySelectorAll("object[arib-type]")[0], "a Japanese page's video plane is found");

    const none = root([element({ "arib-type": "image/jpeg" })]);
    assert.equal(findVideoElement(none), null);
});

test("the shipped default stylesheet hides the PH audio object as well", () => {
    // Asserted against the exported stylesheet string, not the .ts source: a refactor of how the
    // string is built must not fail this, while a missing selector must.
    assert.match(defaultCSS, /object\[type="audio\/X-arib-mpeg4-aac"\]/, "the PH audio object is not hidden");
    assert.match(defaultCSS, /object\[type="audio\/X-arib-mpeg2-aac"\]/, "the Japanese audio object is not hidden");
});

test("the helpers cover every audio and video type the engine ships", () => {
    // Behaviour rather than "DOM.ts mentions the helper": what matters is that each shipped type is
    // classified, so a new type added to the wrong set is caught here.
    assert.equal(isComponentAudioMediaType("audio/X-arib-mpeg2-aac"), true);
    assert.equal(isComponentAudioMediaType("audio/X-arib-mpeg4-aac"), true);
    assert.equal(isAiffMediaType("audio/x-arib-aiff"), true);
    assert.equal(isVideoMediaType("video/X-arib-mpeg2"), true);
    assert.equal(isVideoMediaType("video/X-arib-H264-high"), true);
    assert.equal(isVideoMediaType("image/jpeg"), false);
});
