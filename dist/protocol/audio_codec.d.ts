/**
 * Audio codec sniffing for the PH band.
 *
 * Broadcasters do not reliably label their audio (measured 2026-11-01: ALLTV 485.143 carries ADTS
 * under a `stream_type` of 0x11/LATM, and two more muxes carry non-ADTS payloads under 0x0F/ADTS).
 * A host that trusts the PMT opens the wrong decoder and gets silence, so the first payload bytes are
 * the only trustworthy signal. This module is the one place that decides, and it is exported so a
 * host that receives PES bytes can use the same rule.
 */
/** The audio codings seen on the PH band, by their payload signature. */
export type AudioCodec = "adts" | "latm" | "mp2" | "ac3";
/** `stream_type` values that name audio in ISO/IEC 13818-1 / ARIB STD-B10. */
export declare function isAudioStreamType(streamType: number): boolean;
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
export declare function sniffAudioCodec(bytes: Uint8Array | number[]): AudioCodec | null;
//# sourceMappingURL=audio_codec.d.ts.map