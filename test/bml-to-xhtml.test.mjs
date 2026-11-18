// bmlToXHTMLFXP is pure (string in, string out) and every page goes through it at content.ts:622.
// It renames BML's source attributes to the arib-* names the DOM layer and the engine then look for,
// and normalises whitespace per STD-B24 付属2 5.3.2.
import test from "node:test";
import assert from "node:assert/strict";

import { bmlToXHTMLFXP } from "../dist/client/bml_to_xhtml.js";

const wrap = (inner) => `<html><body>${inner}</body></html>`;

test("object type becomes arib-type", () => {
    const out = bmlToXHTMLFXP(wrap('<object type="video/X-arib-H264-high"></object>'), false);

    assert.match(out, /arib-type="video\/X-arib-H264-high"/);
    assert.doesNotMatch(out, /\stype="video/);
});

test("an object without a type gets no arib-type attribute at all", () => {
    // It used to be written as arib-type="undefined", which is a value the DOM layer would trust.
    const out = bmlToXHTMLFXP(wrap("<object></object>"), false);

    assert.doesNotMatch(out, /arib-type/);
    assert.doesNotMatch(out, /undefined/);
});

test("img src becomes arib-src, and an img without src gets none", () => {
    assert.match(bmlToXHTMLFXP(wrap('<img src="arib://x/p.png"/>'), false), /arib-src="arib:\/\/x\/p\.png"/);
    assert.doesNotMatch(bmlToXHTMLFXP(wrap("<img/>"), false), /arib-src|undefined/);
});

test("script and style are renamed to their arib-* counterparts", () => {
    const out = bmlToXHTMLFXP(wrap("<script>1</script><style>a{}</style>"), false);

    assert.match(out, /<arib-script>/);
    assert.match(out, /<arib-style>/);
    assert.doesNotMatch(out, /<script>/);
});

test("a bml:beitem element is unwrapped to beitem", () => {
    const out = bmlToXHTMLFXP(wrap("<bml:beitem></bml:beitem>"), false);

    assert.match(out, /<beitem>/);
    assert.doesNotMatch(out, /bml:beitem/);
});

test("a's href becomes bml-href so the engine keeps its own", () => {
    const out = bmlToXHTMLFXP(wrap('<a href="arib://x">t</a>'), false);

    assert.match(out, /bml-href="arib:\/\/x"/);
});

test("edge whitespace is dropped and spaces between wide characters removed", () => {
    assert.match(bmlToXHTMLFXP(wrap("<p>  hello  </p>"), false), /<p>hello<\/p>/);
    assert.match(bmlToXHTMLFXP(wrap("<p>あ い</p>"), false), /<p>あい<\/p>/);
});
