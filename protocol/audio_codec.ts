/**
 * Audio codec sniffing for the PH band.
 *
 * Broadcasters do not reliably label their audio (measured 2026-11-01: ALLTV 485.143 carries ADTS
 * under a `stream_type` of 0x11/LATM), and a PES payload can begin in the middle of a frame (measured
 * by OpenDTV-MOD on 479.143/497.143: the first bytes are 8c 85 98 a2, but 37 ADTS sync words follow in
 * the same payload). So the rule is not "look at byte 0" — it is "scan for the first sync word of a
 * recognised coding", the same way their AdtsReader resyncs.
 *
 * Exported so a host that demuxes itself can use the same rule.
 */

/** The audio codings seen on the PH band, by their payload signature. */
export type AudioCodec = "adts" | "latm" | "mp2" | "ac3";

/** `stream_type` values that name audio in ISO/IEC 13818-1 / ARIB STD-B10. */
export function isAudioStreamType(streamType: number): boolean {
    return streamType === 0x03 // MPEG-1 audio
        || streamType === 0x04 // MPEG-2 audio
        || streamType === 0x0f // AAC, ADTS
        || streamType === 0x11; // AAC, LATM
}

/** How far into a payload the scan looks; one ADTS frame is a few hundred bytes at PH bitrates. */
const SCAN_BYTES = 1024;

/**
 * Classify an elementary stream by scanning its first bytes (the PES body) for a coding's sync word.
 *
 * - `FF Fx` — ADTS: 12-bit sync 0xFFF, layer 00, so `(b1 & 0xF6) === 0xF0`
 * - `FF FC` / `FF FD` — MPEG-1 Layer II: sync 0xFFF with layer 10, i.e. `((b1 >> 1) & 3) === 2`
 * - `56` — LATM/LOAS: the AudioMuxElement starts with 0x56
 * - `0B 77` — AC-3 sync word
 *
 * A payload that starts mid-frame still contains the next sync word, so this finds it. Returns null
 * when no sync word appears in the scanned window.
 */
export function sniffAudioCodec(bytes: Uint8Array | number[]): AudioCodec | null {
    const end = Math.min(bytes.length, SCAN_BYTES);
    for (let i = 0; i + 1 < end; i++) {
        const b0 = bytes[i];
        const b1 = bytes[i + 1];
        if (b0 === 0x0b && b1 === 0x77) {
            return "ac3";
        }
        if (b0 === 0x56) {
            return "latm";
        }
        if (b0 !== 0xff) {
            continue;
        }
        // MPEG-1/2 audio: 11-bit sync, then version (2) and layer (2). Layer II is 10.
        if (((b1 >> 1) & 0x03) === 0x02) {
            return "mp2";
        }
        // ADTS: the 12-bit sync 0xFFF then ID, layer 00, protection, so (b1 & 0xF6) === 0xF0.
        if ((b1 & 0xf6) === 0xf0) {
            return "adts";
        }
    }
    return null;
}

/**
 * The coding a `stream_type` claims to carry, or null when the type names no audio we know.
 *
 * The PH band mislabels audio, so this is only what the table says; `labelAgrees` in the
 * `audioCodec` message is the comparison a host can trust.
 */
export function codecForStreamType(streamType: number): AudioCodec | null {
    switch (streamType) {
        case 0x03:
        case 0x04:
            return "mp2";
        case 0x0f:
            return "adts";
        case 0x11:
            return "latm";
        default:
            return null;
    }
}