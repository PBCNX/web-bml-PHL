# Philippine profile — the record

Every change this fork makes, with the standard's clause and the measurement behind it.

## Changes

| # | change | why |
|---|---|---|
| P6 | decode a document by the charset it declares | a UTF-8 page rendered `Peñafrancia` as `Pe?afrancia`; a Shift_JIS demo drew mojibake |
| P1 | `getDiagnostics()` | a page stuck on `読み込み中` and a yellow label drawing the fallback were invisible from outside |
| P7 | ARIB text designation | 61 of 111 valid UTF-8 `.btb` fields rendered as CJK (`Parañaque` → `Para単aque`) |
| P2 | the 139-code PH area table | one table shared by engine, runtime and editor; coverage read the reference way |

## Checklist

| # | requirement | state |
|---|---|---|
| C1 | decode by the declared charset | done |
| C2 | `.btb` text is UTF-8; Ñ/ñ decode | done |
| C3 | no BOM reaches the page | done |
| C4 | C1 controls as `C2 80–C2 9F` | done |
| C5 | no JIS/DRCS for PH text | done for PH pages |
| C6 | language `tl`/`eng` in SI | not engine |
| C7 | PH remote-control key table | not engine |
| C8 | key id allocated per service area | not engine |
| C9 | Ginga removed | not engine |
| C10 | `data_component_id` 0x0C / 0x0D | done |
| C11 | `audio/X-arib-mpeg4-aac` | engine side done; the PH band carries LATM, ADTS or MPEG-1 Layer II, may mislabel it, and a PES payload can start mid-frame, so the engine scans for a sync word and reports `audioCodec` |
| C12 | `video/X-arib-H264-high` | engine side done; every measured PH mux is H.264 (playback in a host still unproven) |
| C13 | monospaced face covering PH text | engine side done |
| C14 | 139 EWBS area codes, coverage | done |
| C15 | NVRAM areas at 4 KB | engine side done |
| C16 | the TOT time is the broadcast local time (PH: UTC+8; region/offset/next offset are all 0 — BML-CLK-02, BML-CLK-09) | done |

## The numbers

- **Areas**: the coverage rule was one-directional and disagreed with the reference receiver on
  **391 of 19,321** city pairs; it is symmetric now.
- **Text**: of 111 valid UTF-8 `.btb` fields, 61 were garbled before P7; of 144 tables, none carries a
  C1 control.
- **Fonts**: the face is **BML-PH Sans** (Noto Sans Mono CJK JP derived, 2.2.4). Every non-PUA
  character in the JIS map is present (**0 missing**); Latin-1, Ext-A and Ext-B complete, half-width
  kana **63/63**, Cyrillic complete, Greek 121/135 (14 Coptic-derived archaic letters have no source).
  Every half-width letter advances 0.5 em with its ink inside the cell; kana/kanji/`U+3000`/`℃` are
  1 em; `࿖` (U+0FD6) comes from Noto Serif Tibetan. The old M+/Kosugi/PHLatin files are deprecated
  and go in 3.0.0.
- **Clock**: TV5 and `preview.ts` declare **+480**; `GMA-BML.ts` declares country PHL with **0**, read
  as +480; a Japanese stream with no descriptor stays unknown.
- **Corpus**: 65 PH page files — 644,473 ASCII, 26 hiragana, 37 katakana, 14 CJK, no Latin-1 letters
  (the `ñ` lives in the `.btb` text tables).

The repository carries none of the captures these were measured on.

## Cross-reference: PBCNX/ISDBTph-Standards

The community guide at `PBCNX/ISDBTph-Standards` (`bml-standards-guide.md`) numbers every rule
(`BML-*`); this file numbers the fork's own changes (`C1`–`C16`, `P1`–`P14`). Where they meet:

| guide rule | what it says | what this engine does |
|---|---|---|
| **BML-FONT-06** | code set 0 (ASCII) draws at half the font size wide | every half-width letter advances 0.5 em, ink inside the cell |
| **BML-FONT-07** | the width of PH-set characters **outside** code set 0 (ñ, symbols) is **not stated** | we keep 0.5 em for ñ and the accented Latin so layout cannot move — a decision, not a rule; the guide lists it as an open question |
| **BML-FONT-10** | PH font coverage is Table A8-1-2, **not** the Japanese list | BML-PH Sans/RoundGothic are supersets (every non-PUA JIS character plus Latin-1 and the PH set); PH pages lose nothing |
| **BML-SND-03, BML-SND-10** | PH stream audio is MPEG-4 AAC in **LATM/LOAS**, stream type **0x11** | the demuxer reports `audioCodec` and `labelAgrees` because the band also sends ADTS under 0x11 (ALLTV, measured 2026-11-01) and MPEG-1 Layer II on other muxes; the host sniffs instead of trusting the label |
| **BML-CLK-01, BML-CLK-02, BML-CLK-09** | the TOT field is the **national time** (PH UTC+8), and `=0` fixes region, `local_time_offset` and `next_time_offset` all at 0 (Q3 answered by reading, 2026-11-01) | the engine reports the field **verbatim** and the descriptor verbatim; the host chooses between "as sent" (the standard: display the field) and "the box" (TVplus adds +8 whatever the descriptor says). Measured 2026-10-31: TV5 sends local time with 0 offsets (matches), GMA sends UTC in the field (departs), ALLTV says BRA, RPTV has TDT only. Our own 2023 TV5 captures declared +8:00 — a vintage difference the guide records as unresolved |
| **BML-CLK-06** | TOT is PID 0x0014, `table_id` 0x73 | parsed there |

Nothing in the guide required a change to the engine; it confirmed the choices and named two of them as
open questions (the ñ width and the `=0` reading), which is why the engine reports instead of
correcting.
