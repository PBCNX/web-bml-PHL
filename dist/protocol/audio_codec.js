"use strict";
/**
 * Audio codec sniffing for the PH band.
 *
 * Broadcasters do not reliably label their audio (measured 2026-11-01: ALLTV 485.143 carries ADTS
 * under a `stream_type` of 0x11/LATM, and two more muxes carry non-ADTS payloads under 0x0F/ADTS).
 * A host that trusts the PMT opens the wrong decoder and gets silence, so the first payload bytes are
 * the only trustworthy signal. This module is the one place that decides, and it is exported so a
 * host that receives PES bytes can use the same rule.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAudioStreamType = isAudioStreamType;
exports.sniffAudioCodec = sniffAudioCodec;
/** `stream_type` values that name audio in ISO/IEC 13818-1 / ARIB STD-B10. */
function isAudioStreamType(streamType) {
    return streamType === 0x03 // MPEG-1 audio
        || streamType === 0x04 // MPEG-2 audio
        || streamType === 0x0f // AAC, ADTS
        || streamType === 0x11; // AAC, LATM
}
/**
 * Classify an elementary stream by its first bytes (bytes after the PES header).
 *
 * - `FF Fx` — ADTS: 12-bit sync 0xFFF, layer 00, so the low nibble of the second byte is 0xF
 * - `FF FC` / `FF FD` — MPEG-1 Layer II: sync 0xFFF with layer 10 (the difference from ADTS is bit 1)
 * - `56` — LATM/LOAS: the AudioMuxElement starts with 0x56
 * - `0B 77` — AC-3 sync word
 *
 * Returns null when there is not enough data or the bytes match none of the known codings.
 */
function sniffAudioCodec(bytes) {
    if (bytes.length < 2) {
        return null;
    }
    const b0 = bytes[0];
    const b1 = bytes[1];
    if (b0 === 0x0b && b1 === 0x77) {
        return "ac3";
    }
    if (b0 === 0xff) {
        // MPEG-1/2 audio: 11-bit sync, then version (2) and layer (2). Layer II is 10.
        if (((b1 >> 1) & 0x03) === 0x02) {
            return "mp2";
        }
        // ADTS: the 12-bit sync 0xFFF then ID, layer 00, protection, so (b1 & 0xF6) === 0xF0.
        if ((b1 & 0xf6) === 0xf0) {
            return "adts";
        }
    }
    if (b0 === 0x56) {
        return "latm";
    }
    return null;
}
//# sourceMappingURL=audio_codec.js.map