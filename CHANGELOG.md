# Changelog

All changes against upstream `tsukumijima/web-bml` (fork point `faf4d96`). The record with sources
and measurements is [`docs/PATCHES.md`](docs/PATCHES.md).

## 2.3.4 — the audio codec in the diagnostics snapshot

- `getDiagnostics()` now carries `audioCodecs`: one record per component with `codec`, `expectedCodec`
  and `labelAgrees`, the same facts the `audioCodec` message reports. A host that polls the snapshot
  (the editor does, once a second) can surface "this mux lies" without subscribing to the message
  stream — asked for by the editor session, and it is the ALLTV case an author should be told about.
## 2.3.3 — a DII that spans sections

- The DII index kept only the **first section** of a transaction: a DII that spans
  `section_number`/`last_section_number` announced its modules in several sections, and every section
  after the first was ignored (and the same-transaction sections were dropped outright). Sections of one
  transaction are now merged, and the `moduleListUpdated` message carries the merged list; a new
  transaction still resets the component.
- Spec-correctness fix, not a reproduction: the BS-TBS capture in hand carries service 161 with data
  components 96/80/64 and no component 60, so it cannot exercise the `/60/2003…` console lines — those
  need the file (or the service) where component 60 exists.
## 2.3.2 — the NVRAM area a BS page actually asks for

- **Two NVRAM bugs found on BS-TBS (console: `readNVRAM: findNvramArea failed
  nvram:///03/group/30`):**
  - the page writes the affiliation as a path segment (`nvram:///03/group/30`), not the grammar's
    `nvram://03;group/30`; the parser now normalises the path form, so both name the same area.
  - the area table was matched by its own `broadcastType` instead of the receiver's permissions, so
    `group` (one row that grants GR and BS "rw" and denies CS) was invisible to BS receivers, and
    `tr_common` (BS read-only) was reported as "unknown". Matching is now by the receiver's permission
    row, which is what the table was always meant to say.
- Tests cover both forms and the `tr_common` read-only case.
## 2.3.1 — the label disagreement, in the message

- `audioCodec` now also carries `expectedCodec` (what the PMT's `stream_type` claims) and
  `labelAgrees`. OpenDTV-MOD asked for exactly this field: it lets a host say "this mux lies about this
  component" without keeping its own table. ALLTV 485.143 → `codec: "adts", expectedCodec: "latm",
  labelAgrees: false`; 503.143/557.143 → LATM/LATM, `labelAgrees: true`.
- `codecForStreamType()` exported beside `sniffAudioCodec()` for hosts that demux themselves.
## 2.3.0 — BML-PH RoundGothic

- **New face:** `BML-PH RoundGothic`, the Kosugi/maru look with the Sans face's cell and coverage:
  1.34 MB woff2, JIS **0 non-PUA missing**, Latin-1/Ext-A/B complete, half-width kana 63/63, Greek
  121/135, Cyrillic complete, symbols and fractions, `₱`, `࿖`.
- Kosugi Maru is the base (Apache-2.0); everything Kosugi lacks comes from the Noto families. Accents
  are fitted to their base letter like the Sans face, Greek/Cyrillic keep one size per script, and the
  ink test covers the new face too.
- No bold cut (Kosugi has none): CSS synthesizes it.
- The old M+/Kosugi/PHLatin files stay until 3.0.0; this is the face hosts can adopt early.
## 2.2.6 — sniff past a mid-frame PES start

- OpenDTV-MOD's correction: on 479.143/497.143 the first PES payload begins **mid-frame** (`8c 85 98
  a2…`), with 37 and 20 ADTS sync words later in the same payload. 2.2.5's sniff looked at byte 0 and
  would have called those unknown. It now scans up to 1 KiB for the first sync word, the same way an
  ADTS reader resyncs, and the mid-frame case has a test.
- No protocol change: `audioCodec` still reports once per PID.
## 2.2.5 — the audio codec is what the bytes say

- **New `audioCodec` message.** The engine sniffs the first payload bytes of each audio component and
  reports `adts` / `latm` / `mp2` / `ac3` once per PID, with the PMT's `stream_type` beside it so a host
  can log a label-vs-payload disagreement. Measured 2026-11-01 on the PH band: ALLTV (485.143) carries
  **ADTS** under a `0x11`/LATM label, and two muxes carry non-ADTS payloads under `0x0F`/ADTS labels —
  a host that trusts the label gets silence.
- `sniffAudioCodec()` and `isAudioStreamType()` are exported from `web-bml/protocol/audio_codec`, so a
  host that demuxes itself can use the same rule.
- `docs/PATCHES.md`: C11/C12 now say what the band actually carries; the font paragraph describes
  BML-PH Sans instead of the retired M+/Kosugi stack.
- `docs/HOSTING.md`: after 3.0.0 the `phLatin` slot ships no default file.
- `fonts/package.json` fixed (was still 2.0.0 and did not ship the `.ttf`s).
## 2.2.4 — the JIS set is complete

- The last JIS character, **`࿖` (U+0FD6, Tibetan left-facing svasti sign)**, comes from Noto Serif
  Tibetan and is centred in its 1 em cell. Every non-PUA character in the engine's JIS map is now in
  the face: **0 missing**, 343 PUA slots left empty by design.
- Registering the face is still one file; the chunks already isolate the symbols range, so hosts that
  lazy-load never fetch this glyph until a page asks for it.
## 2.2.3 — the rest of the alphabet

- **Latin Extended-A and Ext-B are complete** (98 + 185 characters): Ą ą Ć ć Č č Ď ď ƀ Ɓ Ƃ ƃ … now
  come from Noto Sans and are centred in the 0.5 em cell like the rest of the Latin.
- **The symbol and fraction block is closed**: ☀ ⛄ ⛅ ⚡ ⬅ ⭕ (Noto Sans Symbols / Symbols 2) and all the
  vulgar fractions ⅐ ⅓ ⅔ ⅛ ↉ (Noto Sans), each centred in its 1 em cell.
- Remaining gaps: **22 symbols** (⏫ ⏰ ✅ ✊ ✨ ❌ … the emoji-presentation set) and **14 archaic Greek**
  (Ϣ ϣ Ϥ … Coptic-derived), plus the PUA slots that stay empty by design.
- Sizes: Regular 1.06 MB, Bold 1.08 MB, Lite 0.56 MB, Lite Bold 0.57 MB woff2.
## 2.2.2 — one size per script

- 2.2.1 scaled each Greek and Cyrillic glyph on its own to fill the 1 em cell, so the letters no longer
  agreed in height (Cyrillic а 782 vs е 567). Now **one scale per script**: the capitals match the kana
  height, the design keeps its relative sizes, and only a glyph that would leave the cell is squeezed
  horizontally. Measured: Cyrillic capitals 708–911 (the taller ones carry descenders), lowercase
  524–709; Greek capitals 719, lowercase 560–990.
- `test/fonts-ink.test.mjs` now also fails if a Greek/Cyrillic glyph is taller than the em box or if
  the Cyrillic capitals differ in size by more than 12%.
## 2.2.1 — the accents back in their cells

- 2.2.0 rebuilt the face from the full source and lost the accent fitting: `ñ`/`Ñ`/`À`/`Ó` were drawn
  at the source's wider scale (ink up to 626 in a 500 cell) instead of the base letter's width. Now
  every accented Latin letter is scaled to its base letter's ink width and centred, as 2.1.0 had —
  measured: `ñ` ink 379, same as `n`; 0 of 117 letters outside the cell in all four faces.
- The half-width Latin (U+20–BF) is centred too, so the Bold cut's `&` and `w` stay inside 500.
- Greek and Cyrillic now fill the 1 em cell (α ink 557 → 782) instead of sitting narrow in it.
- New `test/fonts-ink.test.mjs` parses the `.ttf` metric boxes and fails if any U+A0–24F letter's ink
  leaves its cell, or if an accent's ink width differs from its base letter's.
## 2.2.0 — the script set

- `BML-PH Sans` now carries what a PH BML page actually mixes: **₱** (U+20B1) at 0.5 em, **half-width
  kana** (U+FF61–FF9F, all 63) at 0.5 em, and **Greek + Cyrillic** at 1 em (double-byte cells).
- A **bold** cut ships for both variants: `BMLPH-Sans-Bold.woff2` and `BMLPH-SansLite-Bold.woff2`
  (family `BML-PH Sans Bold` / `BML-PH Sans Lite Bold`), plus `.ttf` for Windows install.
- Greek has 23 archaic codepoints no source ships; Cyrillic and half-width kana are complete.
- Chunks regenerated with the new ranges (latin-ph now includes the Greek/Cyrillic pieces).
## 2.1.0 — BML-PH Sans

- **New face:** `BML-PH Sans` (954 KB woff2, 2.0 MB ttf) and `BML-PH Sans Lite` (431 KB, JIS level 1
  only), derived from Noto Sans Mono CJK JP (OFL). The BML cell is enforced on every Latin letter —
  advance 0.5 em, ink centred inside the cell, accented letters matched to their base letter's width
  — and kana/kanji/`U+3000`/`℃` are 1 em. The full face carries `霾` (U+972D), which none of the
  previous faces had.
- Unicode-range chunks (`latin-ph`, `kana`, `cjk`, `symbols`) for hosts that want to load kanji on
  demand, and `.ttf` files for Windows install (Settings > Fonts lists both families).
- `docs/HOSTING.md` now recommends `BML-PH Sans`; the M+ stack stays registered as the deprecated
  path and is removed in 3.0.0.
## 2.0.4 — the engine reports the TOT, and the receiver decides

- The TOT descriptor is **inert on the field receiver**: the ABS-CBN TVplus adds +8 to whatever the
  time field holds, whatever the descriptor says (PCNX-DTV TimeInjector, hardware test 2026-10-06).
  A sweep of eight PH muxes found the same descriptor byte meaning UTC on one mux and local on
  another, so no rule can derive the clock from it.
- The engine therefore reports the **field verbatim** (`currentTime` is the field read as a wall
  clock) and the descriptor verbatim (`localTimeOffsetMinutes`, diagnostic only). The display offset
  is the host's setting, else the default; the stream's declaration never moves the clock.
- A host that follows the box (PH: add +8) shows what the viewer sees. GMA reads 15:24:22 verbatim →
  23:24; TV5 reads 01:38:05 → 09:38 (the eight hours ahead the box shows).
## 2.0.3 — the TOT descriptor says what the field is

- The descriptor is the **time field's** offset from UTC, not the display zone: GMA declares PHL
  +0:00 and its field is UTC (saved at 23:29 PH local, field 15:24 → the page now shows 23:24); TV5,
  NHK and the trunk declare a real offset and their fields are local. The page clock is shown in the
  broadcaster's zone (`streamClockOffsetMinutes`: PH is +8:00, else the declared value or JST).
- A PH stream's polarity is ignored: TV5's descriptor byte `0x03` sets the bit the parser reads as
  polarity (a −8:00 declaration, impossible for PH). The magnitude is the offset; PH cannot sit west
  of UTC.
- **Known limit:** a stream whose field is local but declares +0:00 cannot be told apart from GMA's
  UTC field by the descriptor alone — PTV's 2014 capture is one (TOT 18:14, on-screen clock 18:13,
  declared 0). It needs a host override; the rule reads it eight hours out.
## 2.0.2 — the table text of a Japanese page, and the EWBS test flag

- `.btb` text on a document that declares EUC-JP or Shift_JIS is no longer guessed as UTF-8: the
  bytes are often valid UTF-8 too (TBS's 鉄道 is C5 B4 C6 BB, which read as "Ŵƻ"). The table decoder
  now takes its coding and its fallback from the document's declared charset, so a Japanese page gets
  the strict reading even when the host passes `textCoding: "auto"`. Philippine pages are unchanged.
- `EwbsDecision.ends` is now `test`, and it means what TR-B14 says: `start_end_flag` 0 is a **test**
  emergency warning, not an ending. A host told `test: true` must not open a page — and must not stand
  down either, as it would have with the old field name.
## 2.0.1 — the TOT is the broadcast local time

- The TOT's time field is the **local** time (PH standard Table 35: Filipino official time, UTC+8;
  Table 36 deletes the offset descriptor). The decoder had converted it as if it were JST, so a PH
  stream displayed one hour behind its own TOT — measured: GMA read 14:24 for a 15:24:22 TOT, TV5
  read 08:38 for 01:38:05 (its stray negative declaration), `preview.ts` 13:58 for 14:58:39.
- A Philippine stream is now always +8:00, whatever the descriptor says (0, a negative, or nothing);
  Japan keeps its declared offset, and a stream with no descriptor still falls back to JST.
## 2.0.0 — the refactored engine

- The engine moved into packages (`client/`, `protocol/`, `server/`, `es2/`); the published entry
  points (`web-bml`, `web-bml/ts`, `web-bml/protocol`, `web-bml/entity-parser`) are unchanged.
- EWBS: the alert descriptor is read from the PMT and acted on, not just displayed.
- `getDiagnostics()` gains `areaCode`, `configuration` and `streamErrors`.
- 201 tests (170 pass, 31 skip without captures).
- The M+ typeface is the profile's look (M PLUS 1 Code / 1P, Kosugi as the last resort).
- Decoder robustness: unreadable DRCS, CLUT and NVRAM data answers instead of throwing.

## 1.1.1 — the clock on a zero-offset stream

- A stream declaring country PHL with a zero offset reads as +8:00 instead of UTC (GMA's capture).

## 1.1.0 — the PH profile

- Decode by the declared charset; ARIB text by its designation.
- The 139-code EWBS area table, coverage read the reference way.
- Clock from the stream's TOT offset (+480).
- PH media types accepted by type; NVRAM areas sizeable to 4 KB.
- The M+ typeface, with the ARIB family names kept.
- `build:iife`, the `audioOutput` seam, the configuration snapshot.
