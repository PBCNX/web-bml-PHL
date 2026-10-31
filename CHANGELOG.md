# Changelog

All changes against upstream `tsukumijima/web-bml` (fork point `faf4d96`). The record with sources
and measurements is [`docs/PATCHES.md`](docs/PATCHES.md).

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
