// 2.6.1: the BIT section becomes the "bit" message the client's BroadcasterDatabase consumes. The
// capture that prompted it (BS-TBS, service 161) carries only serviceList, siParameter and
// broadcasterName for broadcaster 4 - no extended broadcaster descriptor - so an empty affiliation
// list is a fact about the stream, not a parse failure.
import test from "node:test";
import assert from "node:assert/strict";

import { bitMessageFromSection } from "../dist/server/decode_ts.js";

const section = {
    originalNetworkId: 4,
    broadcasters: [
        {
            broadcasterId: 4,
            broadcasterDescriptors: [
                { tag: "serviceList", services: [{ serviceId: 161, serviceType: 1 }, { serviceId: 162, serviceType: 1 }] },
                { tag: "broadcasterName", name: Uint8Array.from([0x0e, 0x42, 0x53, 0x54, 0x42, 0x53]) },
            ],
        },
        {
            broadcasterId: 255,
            broadcasterDescriptors: [
                {
                    tag: "extendedBroadcaster",
                    broadcasterType: "terrestrial",
                    terrestrialBroadcasterId: 7,
                    affiliationIdList: [0, 1],
                    broadcasters: [{ originalNetworkId: 0x7fe0, broadcasterId: 7 }],
                },
            ],
        },
    ],
};

test("name, services and the empty affiliation are carried through", () => {
    const msg = bitMessageFromSection(section);
    assert.equal(msg.type, "bit");
    assert.equal(msg.originalNetworkId, 4);
    const bs = msg.broadcasters[0];
    assert.equal(bs.broadcasterId, 4);
    assert.equal(bs.broadcasterName, "\uFF22\uFF33\uFF34\uFF22\uFF33", "the BIT spells it in full-width: ＢＳＴＢＳ");
    assert.deepEqual(bs.services.map(s => s.serviceId), [161, 162]);
    assert.deepEqual(bs.affiliations, [], "no 0xCE in this stream means no affiliation, not a crash");
    assert.equal(bs.terrestrialBroadcasterId, undefined);
});

test("an extended terrestrially-present broadcaster carries its affiliations", () => {
    const msg = bitMessageFromSection(section);
    const nhk = msg.broadcasters[1];
    assert.deepEqual(nhk.affiliations, [0, 1]);
    assert.equal(nhk.terrestrialBroadcasterId, 7);
    assert.deepEqual(nhk.affiliationBroadcasters, [{ originalNetworkId: 0x7fe0, broadcasterId: 7 }]);
});
