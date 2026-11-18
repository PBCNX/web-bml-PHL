import { test } from "node:test";
import assert from "node:assert/strict";

import { describeConfiguration } from "../dist/client/configuration.js";

// The configuration half of the diagnostics snapshot: the three per-host settings that change what a
// page shows, plus the fonts. The precedence must match the clock's, or the snapshot would lie.

const base = {
    textCoding: "auto",
    hostOffsetMinutes: null,
    streamOffsetMinutes: null,
    defaultOffsetMinutes: 540,
    nvramAreaBytes: null,
    nvramAffiliationBytes: null,
    nvramBroadcasterBytes: null,
    fonts: [],
};

test("the display offset is the host's, else the default; the stream is diagnostic", () => {
    // The TOT descriptor is inert on the field receiver (the TVplus adds +8 itself), so a stream's
    // declaration never moves the clock - it is reported, and a host that follows the box sets its
    // own offset.
    const dflt = describeConfiguration(base);
    assert.equal(dflt.localTimeOffsetMinutes, 540);
    assert.equal(dflt.localTimeOffsetSource, "default");

    const stream = describeConfiguration({ ...base, streamOffsetMinutes: 480 });
    assert.equal(stream.localTimeOffsetMinutes, 540, "the stream declaration does not move the clock");

    const host = describeConfiguration({ ...base, hostOffsetMinutes: 480, streamOffsetMinutes: 540 });
    assert.equal(host.localTimeOffsetMinutes, 480);
    assert.equal(host.localTimeOffsetSource, "host", "the host follows the receiver");
});

test("the remaining settings are reported as the host set them", () => {
    const snapshot = describeConfiguration({
        ...base,
        textCoding: "arib",
        nvramAreaBytes: 4096,
        fonts: ["丸ゴシック", "PH Latin"],
    });
    assert.equal(snapshot.textCoding, "arib");
    assert.equal(snapshot.nvramAreaBytes, 4096);
    assert.deepEqual(snapshot.fonts, ["丸ゴシック", "PH Latin"]);
});

test("the snapshot survives JSON round-trip, as the diagnostics promise", () => {
    const snapshot = describeConfiguration({ ...base, hostOffsetMinutes: 480, fonts: ["丸ゴシック"] });
    assert.deepEqual(JSON.parse(JSON.stringify(snapshot)), snapshot);
});
test("the per-area NVRAM overrides are reported, not just the combined one", () => {
    // A host that sizes only the affiliation area (the 24-affiliation provisioning) must see that in
    // the snapshot; it used to read null because only nvramAreaBytes was copied through.
    const described = describeConfiguration({
        ...base,
        nvramAffiliationBytes: 4096,
        nvramBroadcasterBytes: 512,
    });

    assert.equal(described.nvramAreaBytes, null, "the combined option was not set");
    assert.equal(described.nvramAffiliationBytes, 4096);
    assert.equal(described.nvramBroadcasterBytes, 512);
});