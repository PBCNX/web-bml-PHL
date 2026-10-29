// The PH declaration path, at the first step: a page writes `body{resolution:720x480}`, which is not
// a CSS property a browser knows. The engine's BML CSS path rewrites the ARIB extension properties
// into the custom properties the layout reads, and this is where that happens for every PH page.
//
// Measured in the corpus (2026-10-27): ABS-CBN's `common.css:1` and GMA's and TV5's `startup.bml`
// all declare `resolution:720x480` this way, so if this mapping breaks, every PH page lays out at
// the default 960x540 instead of the declared box.
import test from "node:test";
import assert from "node:assert/strict";
import { transpileCSS } from "../dist/client/transpile_css.js";

const transpile = (cssText) => transpileCSS(cssText, { inline: false, clutReader: async () => [] });

test("a page's resolution:720x480 reaches the layout as --resolution", () => {
    return transpile("body{resolution:720x480}").then((out) => {
        assert.match(out, /--resolution:\s*720x480/);
        // The still-picture plane is 1:1 with the text plane at 720x480 (it is half at 960x540).
        assert.match(out, /--still-picture-plane-scale:\s*1/);
    });
});

test("the other declared resolutions and the key list map too", () => {
    return Promise.all([
        transpile("body{resolution:240x480}").then((out) => assert.match(out, /--resolution:\s*240x480/)),
        transpile("body{display-aspect-ratio:4v3}").then((out) => assert.match(out, /--display-aspect-ratio:\s*4v3/)),
        transpile("body{used-key-list:basic data-button}").then((out) => assert.match(out, /--used-key-list:\s*basic data-button/)),
    ]);
});

test("a page that declares nothing leaves the default in place", () => {
    return transpile("body{color:red}").then((out) => {
        assert.ok(!out.includes("--resolution"), "no resolution declaration, no custom property");
        // The default (960x540) lives in default_css.ts, so the engine's fallback is the CSS, not this.
    });
});
