# Changelog

All changes against upstream `tsukumijima/web-bml` (fork point `faf4d96`). The record with sources
and measurements is [`docs/PATCHES.md`](docs/PATCHES.md).

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
