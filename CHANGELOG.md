# Changelog

All changes against upstream `tsukumijima/web-bml` (fork point `faf4d96`). The record with sources
and measurements is [`docs/PATCHES.md`](docs/PATCHES.md).

## 1.1.3 — a Japanese page's table text

- `.btb` text on a document that declares EUC-JP or Shift_JIS is no longer guessed as UTF-8: the
  bytes are often valid UTF-8 too (TBS's 鉄道 is C5 B4 C6 BB, which read as "Ŵƻ"). The table decoder
  now takes its coding and its fallback from the document's declared charset, so a Japanese page gets
  the strict reading even when the host passes `textCoding: "auto"`. Philippine pages are unchanged.
## 1.1.2 — the TOT is the broadcast local time

- The TOT's time field is the local time (PH standard Table 35: Filipino official time, UTC+8;
  Table 36 deletes the offset descriptor). The decoder converted it as JST, so a PH stream displayed
  one hour behind its own TOT — measured: GMA 14:24 for a 15:24:22 TOT, `preview.ts` 13:58 for
  14:58:39, and TV5 08:38 for 01:38:05 (its stray negative declaration).
- A PH stream is now +8:00 whatever the descriptor says; Japan keeps its declared offset, and a
  stream with no descriptor still falls back to JST.
## 1.1.1 — the clock on a zero-offset stream

- A stream declaring country PHL with a zero offset reads as +8:00 instead of UTC (GMA's capture).
- TV5's +480 and the no-descriptor case are unchanged.

## 1.1.0 — the PH profile

- Decode by the declared charset; ARIB text by its designation.
- The 139-code EWBS area table, coverage read the reference way (391 of 19,321 pairs corrected).
- Clock from the stream's TOT offset (+480).
- PH media types accepted by type; NVRAM areas sizeable to 4 KB.
- The M+ typeface as the profile's look, with the ARIB family names kept; Kosugi as the last resort.
- `build:iife`, the `audioOutput` seam, the configuration snapshot, decoder robustness.
