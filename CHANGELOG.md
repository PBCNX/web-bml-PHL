# Changelog

All changes against upstream `tsukumijima/web-bml` (fork point `faf4d96`). The record with sources
and measurements is [`docs/PATCHES.md`](docs/PATCHES.md).

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
