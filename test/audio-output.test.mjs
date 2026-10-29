import { test } from "node:test";
import assert from "node:assert/strict";

import { playAIFF } from "../dist/client/media/arib_aiff.js";
import { playRomSound } from "../dist/client/media/romsound.js";

// The audio-output seam: an Android host used to patch these two files to route sound to its native
// player, which made every engine update re-apply the patch. The host now passes hooks; returning true
// means "I played it", and the engine must not touch WebAudio at all.

test("a rom-sound hook takes the sound id and the engine never touches WebAudio", () => {
    let seen;
    // A destination that would throw on any use: if the engine fell through to WebAudio the test fails.
    const destination = {
        get context() {
            throw new Error("WebAudio must not be used when the host played the sound");
        },
    };
    const played = playRomSound(7, destination, {
        romSound: (soundId) => {
            seen = soundId;
            return true;
        },
    });
    assert.equal(played, true);
    assert.equal(seen, 7);
});

test("a hook that declines leaves the engine in charge", () => {
    let asked = 0;
    const output = {
        romSound: () => {
            asked++;
            return false;
        },
    };
    // 999 is not a defined ROM sound, so the built-in path returns false without playing anything.
    assert.equal(playRomSound(999, { context: null }, output), false);
    assert.equal(asked, 1, "the hook must be asked even when it declines");
});

test("an AIFF hook takes the bytes and suppresses the built-in player", () => {
    const bytes = new Uint8Array([0x46, 0x4f, 0x52, 0x4d]); // "FORM"
    let received = null;
    const output = {
        aiff: (aiff) => {
            received = aiff;
            return true;
        },
    };
    const result = playAIFF({ context: null }, bytes, output);
    assert.equal(result, null, "the seam returns null when the host played the clip");
    assert.equal(received, bytes);
});

test("without a hook the built-in AIFF decoder rejects a non-AIFF clip without throwing", () => {
    const result = playAIFF({ context: null }, new Uint8Array([0, 1, 2, 3]));
    assert.equal(result, null);
});
