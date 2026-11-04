/**
 * C11/C12, the PH media types.
 *
 * The Philippine profile replaces the Japanese audio and video component types (AP8-1 §5.7.3 and
 * §5.11): `audio/X-arib-mpeg4-aac` instead of `audio/X-arib-mpeg2-aac`, and `video/X-arib-H264-high`
 * instead of `video/X-arib-mpeg2`. The engine keeps both — Japan still uses the old ones — and every
 * place that used to compare one literal now goes through these helpers, so a page's declared type is
 * matched case-insensitively and a PH page gets the same treatment as a Japanese one.
 *
 * What this does **not** do is decode the codec: the audio and video payloads are demultiplexed by the
 * host and played through the host's media pipeline (`example/`), which is why the checklist calls the
 * media surface "handled, not proven" — proving it needs a capture with the new component types.
 */
export declare function normalizeMediaType(type: string | null | undefined): string;
/** True for an audio type that references a stream (component tag). */
export declare function isComponentAudioMediaType(type: string | null | undefined): boolean;
/** True for the AIFF clip type (a self-contained `arib-dc://`/data resource). */
export declare function isAiffMediaType(type: string | null | undefined): boolean;
/** True for any audio type the engine recognises (stream-referenced or AIFF). */
export declare function isAudioMediaType(type: string | null | undefined): boolean;
/** True for the video plane, whichever of the ARIB video types the page declares. */
export declare function isVideoMediaType(type: string | null | undefined): boolean;
/**
 * The video plane element, matched by type rather than by one literal: a PH page declares
 * `video/X-arib-H264-high` and a Japanese one `video/X-arib-mpeg2`, and both are the same object.
 */
export declare function findVideoElement(root: ParentNode): Element | null;
//# sourceMappingURL=media_type.d.ts.map