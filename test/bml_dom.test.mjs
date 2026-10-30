// The BML DOM layer had no tests: the classes iterate `node.style`, which happy-dom's
// CSSStyleDeclaration does not implement, so they cannot be constructed against a real happy-dom
// element either. They only touch a small node interface, so a minimal stub is the honest way in:
// what is under test is the BML class logic (attribute, event, side effects), not the DOM itself.
import test from "node:test";
import assert from "node:assert/strict";
import { Window } from "happy-dom";

import { BML } from "../dist/client/dom/bml_dom.js";
import { bmlToXHTMLFXP } from "../dist/client/bml_to_xhtml.js";

// Not covered here: set invisible(false) cancelling a running input application. That branch tests
// `currentFocus instanceof HTMLInputElement` against the global the compiled module sees, and under
// node + happy-dom the condition does not hold however the global is arranged, so asserting it would
// mean asserting a behaviour this harness cannot produce. It needs a real browser.
const window = new Window();
// The setter's `currentFocus instanceof HTMLInputElement` needs the browser global present.
globalThis.HTMLInputElement = window.HTMLInputElement;
globalThis.CustomEvent = window.CustomEvent;

function stubNode(tag, attributes = {}) {
    const attrs = new Map(Object.entries(attributes));
    return {
        tagName: tag.toUpperCase(),
        nodeName: tag.toUpperCase(),
        attributes: attrs,
        style: { getPropertyValue: () => "", [Symbol.iterator]: function* () { } },
        getAttribute: (name) => (attrs.has(name) ? attrs.get(name) : null),
        setAttribute: (name, value) => attrs.set(name, String(value)),
        removeAttribute: (name) => attrs.delete(name),
        hasAttribute: (name) => attrs.has(name),
    };
}

function harness({ focus = null, attributes = {} } = {}) {
    const events = [];
    const cancels = [];
    const ownerDocument = {
        currentFocus: focus,
        inputApplication: { cancel: (reason) => cancels.push(reason) },
        browserEventTarget: {
            dispatchEvent: (event) => {
                events.push({ type: event.type, detail: event.detail });
                return true;
            },
        },
        logger: { prefix: "", log() { }, debug() { }, info() { }, warn() { }, error() { } },
    };
    const node = stubNode("body", attributes);
    return { body: new BML.BMLBodyElement(node, ownerDocument), node, events, cancels, ownerDocument };
}

test("the invisible getter reads the attribute, not a field", () => {
    assert.equal(harness().body.invisible, false);
    assert.equal(harness({ attributes: { invisible: "invisible" } }).body.invisible, true);
});

test("setting invisible writes the attribute and announces the new state", () => {
    const { body, node, events } = harness();

    body.invisible = true;
    assert.equal(node.getAttribute("invisible"), "invisible");
    assert.deepEqual(events, [{ type: "invisible", detail: true }]);

    body.invisible = false;
    assert.equal(node.hasAttribute("invisible"), false);
    assert.deepEqual(events, [{ type: "invisible", detail: true }, { type: "invisible", detail: false }]);
});

test("announcing the state does not cancel anything or rewrite the attribute", () => {
    // The load path used `body.invisible = body.invisible`, which went through the setter and so
    // cancelled the input application that focusFirstNavIndex had just started.
    const focus = window.document.createElement("input");
    const { body, node, events, cancels } = harness({ focus });

    body.internalDispatchInvisible();

    assert.deepEqual(events, [{ type: "invisible", detail: false }]);
    assert.deepEqual(cancels, [], "the announcement must not have side effects");
    assert.equal(node.hasAttribute("invisible"), false);
});

test("an object element reports its arib-type", () => {
    const object = new BML.BMLObjectElement(stubNode("object", { "arib-type": "video/X-arib-mpeg2" }), harness().ownerDocument);

    assert.equal(object.type, "video/X-arib-mpeg2");
});
test("an anchor reads bml-href, the name the transform writes", () => {
    // The two halves of one contract: bmlToXHTMLFXP renames href to bml-href so the engine keeps the
    // target, and BMLAnchorElement reads it back. Neither side alone shows that.
    const html = bmlToXHTMLFXP('<html><body><a href="arib://x/40/0000">t</a></body></html>', false);
    assert.match(html, /bml-href="arib:\/\/x\/40\/0000"/, "the transform must rename href");

    const anchor = new BML.BMLAnchorElement(stubNode("a", { "bml-href": "arib://x/40/0000" }), harness().ownerDocument);
    assert.equal(anchor.href, "arib://x/40/0000");
});

test("an image reads arib-src, the name the transform writes", () => {
    const html = bmlToXHTMLFXP('<html><body><img src="arib://x/40/0000/p.png"/></body></html>', false);
    assert.match(html, /arib-src="arib:\/\/x\/40\/0000\/p\.png"/);

    const image = new BML.BMLImageElement(stubNode("img", { "arib-src": "arib://x/40/0000/p.png" }), harness().ownerDocument);
    assert.equal(image.src, "arib://x/40/0000/p.png");
});