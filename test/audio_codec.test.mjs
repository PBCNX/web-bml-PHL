// C11/C12 - the audio codec is what the bytes say, not what the PMT label says.
// Measured 2026-11-01 on the PH band: 485.143 (ALLTV) carries ADTS (FF F1 4C 80) under a
// stream_type of 0x11 (LATM), and two muxes carry non-ADTS payloads under 0x0F (ADTS).
import test from "node:test";
import assert from "node:assert/strict";
import { isAudioStreamType, sniffAudioCodec } from "../dist/protocol/audio_codec.js";

test("the four audio signatures are told apart", () => {
    assert.equal(sniffAudioCodec([0xff, 0xf1, 0x4c, 0x80]), "adts", "ALLTV's bytes");
    assert.equal(sniffAudioCodec([0xff, 0xfc, 0x84, 0x00]), "mp2", "MPEG-1 Layer II");
    assert.equal(sniffAudioCodec([0x56, 0xe0, 0xf9, 0xfb]), "latm", "LOAS/LATM");
    assert.equal(sniffAudioCodec([0x0b, 0x77, 0x00, 0x00]), "ac3", "AC-3");
    assert.equal(sniffAudioCodec([0x21, 0x1d, 0x47, 0x8c]), null, "raw AAC is not ADTS");
    assert.equal(sniffAudioCodec([0x00]), null, "too short");
});

test("the audio stream types are the four the band uses", () => {
    for (const t of [0x03, 0x04, 0x0f, 0x11]) {
        assert.equal(isAudioStreamType(t), true, `0x${t.toString(16)} is audio`);
    }
    for (const t of [0x1b, 0x0d, 0x06, 0x0b]) {
        assert.equal(isAudioStreamType(t), false, `0x${t.toString(16)} is not audio`);
    }
});
