"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMediaType = normalizeMediaType;
exports.isComponentAudioMediaType = isComponentAudioMediaType;
exports.isAiffMediaType = isAiffMediaType;
exports.isAudioMediaType = isAudioMediaType;
exports.isVideoMediaType = isVideoMediaType;
exports.findVideoElement = findVideoElement;
/** Audio component types that reference a stream by component tag (not a self-contained clip). */
const COMPONENT_AUDIO_TYPES = new Set([
    "audio/x-arib-mpeg2-aac",
    "audio/x-arib-aac",
    "audio/x-arib-mpeg4-aac",
]);
const AIFF_TYPES = new Set(["audio/x-arib-aiff"]);
const VIDEO_TYPES = new Set([
    "video/x-arib-mpeg2",
    "video/x-arib-h264",
    "video/x-arib-h264-high",
    "video/x-arib-h264-8bit",
]);
function normalizeMediaType(type) {
    return type?.trim().toLowerCase() ?? "";
}
/** True for an audio type that references a stream (component tag). */
function isComponentAudioMediaType(type) {
    return COMPONENT_AUDIO_TYPES.has(normalizeMediaType(type));
}
/** True for the AIFF clip type (a self-contained `arib-dc://`/data resource). */
function isAiffMediaType(type) {
    return AIFF_TYPES.has(normalizeMediaType(type));
}
/** True for any audio type the engine recognises (stream-referenced or AIFF). */
function isAudioMediaType(type) {
    return isComponentAudioMediaType(type) || isAiffMediaType(type);
}
/** True for the video plane, whichever of the ARIB video types the page declares. */
function isVideoMediaType(type) {
    return VIDEO_TYPES.has(normalizeMediaType(type));
}
/**
 * The video plane element, matched by type rather than by one literal: a PH page declares
 * `video/X-arib-H264-high` and a Japanese one `video/X-arib-mpeg2`, and both are the same object.
 */
function findVideoElement(root) {
    for (const attribute of ["arib-type", "type"]) {
        for (const element of Array.from(root.querySelectorAll(`object[${attribute}]`))) {
            if (isVideoMediaType(element.getAttribute(attribute))) {
                return element;
            }
        }
    }
    return null;
}
//# sourceMappingURL=media_type.js.map