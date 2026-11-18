// The base URI directory decides which URLs internet content may reach. These cases pin the two
// ways the old string-prefix comparison was wrong: a sibling path that merely shares a prefix,
// and a scheme downgrade on the same host.
import test from "node:test";
import assert from "node:assert/strict";

import { Resources } from "../dist/client/resource.js";

const logger = {
    prefix: "",
    log() { },
    debug() { },
    info() { },
    warn() { },
    error() { },
};

function resourcesAt(documentUrl, baseUrl) {
    const resources = new Resources(undefined, {}, logger);
    resources.activeDocument = documentUrl;
    resources.setBaseURIDirectory(baseUrl);
    return resources;
}

test("a URL inside the base directory is in scope", () => {
    const resources = resourcesAt("https://example.com/dir/page.bml", "https://example.com/dir/page.bml");

    assert.equal(resources.checkBaseURIDirectory("https://example.com/dir/other.bml"), true);
    assert.equal(resources.checkBaseURIDirectory("https://example.com/dir/nested/deep.bml"), true);
});

test("a sibling path that shares a prefix is out of scope", () => {
    const resources = resourcesAt("https://example.com/dir/page.bml", "https://example.com/dir/page.bml");

    assert.equal(resources.checkBaseURIDirectory("https://example.com/dirx/other.bml"), false);
    assert.equal(resources.checkBaseURIDirectory("https://example.com/di"), false);
});

test("a different host or a different scheme is out of scope", () => {
    const resources = resourcesAt("https://example.com/dir/page.bml", "https://example.com/dir/page.bml");

    assert.equal(resources.checkBaseURIDirectory("https://evil.example/dir/page.bml"), false);
    assert.equal(resources.checkBaseURIDirectory("http://example.com/dir/page.bml"), false);
    assert.equal(resources.checkBaseURIDirectory("https://example.com:8443/dir/page.bml"), false);
});

test("a non-default port is part of the scope, not dropped from it", () => {
    const resources = resourcesAt("https://example.com:8443/dir/page.bml", "https://example.com:8443/dir/page.bml");

    assert.equal(resources.checkBaseURIDirectory("https://example.com:8443/dir/other.bml"), true, "the page's own port must stay in scope");
    assert.equal(resources.checkBaseURIDirectory("https://example.com/dir/other.bml"), false, "a different port is a different origin");
});

test("nothing is in scope before a base directory is set", () => {
    const resources = new Resources(undefined, {}, logger);
    resources.activeDocument = "https://example.com/dir/page.bml";

    assert.equal(resources.isInternetContent, false);
    assert.equal(resources.checkBaseURIDirectory("https://example.com/dir/page.bml"), false);
});
