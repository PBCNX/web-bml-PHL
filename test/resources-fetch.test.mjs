// resource.ts fetch/coalesce/invalidate/clearCache is the network path every internet page goes
// through, and had no test. The host `ip` seam is injectable, so none of this needs a DOM.
import test from "node:test";
import assert from "node:assert/strict";

import { Resources } from "../dist/client/resource.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const logger = {
    prefix: "",
    log() { },
    debug() { },
    info() { },
    warn() { },
    error() { },
};

function ipStub(handler) {
    const calls = [];
    return {
        calls,
        get: async (url) => {
            calls.push(url);
            return handler(url, calls.length);
        },
    };
}

function response(body, cacheControl) {
    const headers = new Headers({ "content-type": "text/plain" });
    if (cacheControl != null) {
        headers.set("cache-control", cacheControl);
    }
    return { status: 200, headers, body: encoder.encode(body) };
}

function resourcesWith(ip) {
    const resources = new Resources(undefined, ip, logger);
    resources.activeDocument = "https://example.com/dir/page.bml";
    resources.setBaseURIDirectory("https://example.com/dir/page.bml");
    return resources;
}

test("a fetched resource is returned and then served from cache", async () => {
    const ip = ipStub(() => response("hello"));
    const resources = resourcesWith(ip);

    const first = await resources.fetchResourceAsync("https://example.com/dir/a.txt");
    assert.equal(decoder.decode(first.data), "hello");
    assert.equal(ip.calls.length, 1);

    const second = await resources.fetchResourceAsync("https://example.com/dir/a.txt");
    assert.equal(decoder.decode(second.data), "hello");
    assert.equal(ip.calls.length, 1, "the second read must not hit the host again");
});

test("no-store is returned but not cached", async () => {
    const ip = ipStub(() => response("fresh", "no-store"));
    const resources = resourcesWith(ip);

    assert.equal(decoder.decode((await resources.fetchResourceAsync("https://example.com/dir/b.txt")).data), "fresh");
    assert.equal(decoder.decode((await resources.fetchResourceAsync("https://example.com/dir/b.txt")).data), "fresh");
    assert.equal(ip.calls.length, 2, "a no-store response must be re-fetched");
});

test("concurrent requests for the same URL coalesce into one host call", async () => {
    const ip = ipStub(() => response("shared"));
    const resources = resourcesWith(ip);

    const [a, b] = await Promise.all([
        resources.fetchResourceAsync("https://example.com/dir/c.txt"),
        resources.fetchResourceAsync("https://example.com/dir/c.txt"),
    ]);

    assert.equal(decoder.decode(a.data), "shared");
    assert.equal(decoder.decode(b.data), "shared");
    assert.equal(ip.calls.length, 1);
});

test("a URL outside the base directory is refused without calling the host", async () => {
    const ip = ipStub(() => response("nope"));
    const resources = resourcesWith(ip);

    const result = await resources.fetchResourceAsync("https://example.com/elsewhere/d.txt");

    assert.equal(result, null);
    assert.equal(ip.calls.length, 0);
});

test("a host transport failure resolves null instead of rejecting", async () => {
    const ip = ipStub(() => {
        throw new Error("connection reset");
    });
    const resources = resourcesWith(ip);

    const result = await resources.fetchResourceAsync("https://example.com/dir/e.txt");

    assert.equal(result, null);
});

test("invalidateRemoteCache forces the next read to refetch", async () => {
    const ip = ipStub(() => response("v1"));
    const resources = resourcesWith(ip);
    const url = "https://example.com/dir/f.txt";

    await resources.fetchResourceAsync(url);
    resources.invalidateRemoteCache(url);
    await resources.fetchResourceAsync(url);

    assert.equal(ip.calls.length, 2);
});

test("clearCache drops fetched resources and revokes their blob urls", async () => {
    const ip = ipStub(() => response("g"));
    const resources = resourcesWith(ip);
    const url = "https://example.com/dir/g.txt";

    const file = await resources.fetchResourceAsync(url);
    let revoked = null;
    const original = URL.revokeObjectURL;
    URL.revokeObjectURL = (u) => { revoked = u; };
    try {
        file.blobUrl.set("k", { blobUrl: "blob:test" });
        resources.clearCache();
    } finally {
        URL.revokeObjectURL = original;
    }

    assert.equal(revoked, "blob:test", "clearCache must revoke the cached blob url");
    await resources.fetchResourceAsync(url);
    assert.equal(ip.calls.length, 2, "the resource must be gone from the cache");
});
