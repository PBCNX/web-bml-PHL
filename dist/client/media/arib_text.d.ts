import { type TextDecodeFunction } from "../text";
/**
 * P7 — the ARIB text designation rule, and the Philippine lenient reading of it.
 *
 * ARIB STD-B24 text is an 8-bit code with four graphic sets. The defaults for the text this engine
 * reads (BML `.btb` tables, bevent private data) are the SI defaults — G0 = Kanji, G1 = Alphanumeric,
 * GL locked to G0 — so *by default GL bytes are JIS X 0208 pairs, and ASCII needs an explicit
 * switch*: `0E` (LS1) locks GL to G1, `1B 28 4A` designates G0 ← Alphanumeric, `1B 28 42`
 * designates G0 ← Kanji. Until this patch the engine had no designation handling at all: it passed
 * `.btb` strings through the profile's plain decoder, so a designation control survived as U+000E in
 * the page's string and a designated kanji field read as ASCII.
 *
 * Three things are measured, not assumed (TVTest\docs\arib-text-shift.md §2, §3.5, §6):
 *
 *   1. conformant text switches first — TV5's banner is `0E` + "Test Broadcast";
 *   2. GMA's `.btb` text does not — "Kapuso" goes out as bare `4B 61 70 75 73 6F`, with no
 *      designation anywhere in the field;
 *   3. a designation is the guard that keeps Japanese text intact: Japanese captions and SI text
 *      are saturated with `1B 29 4A`, `1B 6E`, `0E`, `0F`, and their kanji is written in GL under
 *      those designations.
 *
 * So the rule, evaluated on each field's own bytes:
 *
 *   a field that carries a character-set switch   -> honour it (designation state machine);
 *   no switch, and an 8-bit byte (GR / UTF-8)     -> the profile's decoder, unchanged — except in
 *                                                    `auto` mode, where a field that is valid
 *                                                    non-ASCII UTF-8 is UTF-8, because that is what
 *                                                    the Philippine standard says text is;
 *   no switch, all 7-bit, and it looks like text  -> Alphanumeric, the lenient reading, in `auto`
 *                                                    mode only;
 *   anything else                                 -> the profile's decoder, i.e. as before.
 *
 * `auto` is the default because this engine is the Philippine one (`PBCNX/web-bml-PHL`); a host that
 * needs upstream's strict reading can pass `textCoding: "arib"`, which leaves every undesignated
 * field on the profile's decoder and only adds designation handling.
 *
 * The residual false positive is real and is why the lenient reading is a policy rather than an
 * unconditional rule: a pure-kanji GL field with no designation anywhere (`日本` as `46 7C 4B 5C`)
 * reads as `F|K\`. That is accepted here — TVTest-PHL accepts it too — and it is bounded by the two
 * conditions below, the unlikely-symbol list in particular.
 */
export type TextCoding = "auto" | "arib";
/**
 * Decode one ARIB text field. `fallback` is the decoder the caller would have used before this
 * patch; it is used for every field the rules above do not claim, so conformant and non-text fields
 * behave exactly as they did.
 */
export declare function decodeARIBText(input: Uint8Array, fallback: TextDecodeFunction, textCoding?: TextCoding): string;
/**
 * The coding to use for `.btb` table text in a document of this charset.
 *
 * `auto` guesses UTF-8, which is right for Philippine text but wrong for a Japanese table: EUC-JP
 * bytes are often valid UTF-8 too (TBS's 鉄道 is C5 B4 C6 BB, which reads as "Ŵƻ"). A document that
 * declares EUC-JP or Shift_JIS therefore gets the strict reading whatever the host asked for.
 */
export declare function tableTextCoding(documentCharset: string | null | undefined, hostCoding: TextCoding): TextCoding;
//# sourceMappingURL=arib_text.d.ts.map