/**
 * The audio-output seam: let a host play the two ARIB sound kinds itself.
 *
 * Android hosts (OpenDTV, baron-wifi) previously replaced the engine's WebAudio playback with native
 * code by **patching `arib_aiff.ts` and `romsound.ts`**, which meant every engine update had to re-apply
 * the patch and the bundle could not be reproduced from the engine. This is the option instead: a host
 * passes `audioOutput`, and when its hook returns true the engine does not touch WebAudio.
 *
 * The hooks are deliberately narrow — the two sounds the engine itself produces:
 * - `aiff`: a TR-B14/TR-B15 AIFF clip (12 kHz, 1 ch, 16 bit) fetched through `arib-dc://…`/data;
 * - `romSound`: a receiver ROM sound id (`romsound://<id>`, decoder ids 0–13).
 */
export type AudioOutput = {
    /** Return true when the host played the clip (the engine then does nothing). */
    aiff?(aiff: Uint8Array): boolean;
    /** Return true when the host played the sound (the engine then does nothing). */
    romSound?(soundId: number): boolean;
};
//# sourceMappingURL=audio_output.d.ts.map