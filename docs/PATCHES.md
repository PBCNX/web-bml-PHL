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
| C16 | the TOT time is the broadcast local time (PH: UTC+8; region/offset/next offset are all 0 — MC14 AP5-1 Table 35, ABNT NBR 15608-3 Table 36 deleted) | done |

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

## Standards notes

Where a change follows the profile, the citation is the document and its section — never a private
working note. The three that come up most:

| citation | what it fixes | what this engine does |
|---|---|---|
| NTC MC 07-12-2014 Annex 8-1 §1.2.5; ARIB STD-B24 v5.2 A2-4.4.8; TR-B14 v3.8 Table 1-6 | code set 0 draws at half the font size; no proportional font | every half-width letter advances 0.5 em, ink inside the cell |
| — (the profile does not state it) | the width of PH-set characters **outside** code set 0 (ñ, symbols) | 0.5 em, a decision so layout cannot move; no rule requires it |
| NTC MC 07-12-2014 Annex 8-1 §1.2.5, Table A8-1-2 | PH font coverage is the PH table, not the Japanese list | BML-PH Sans/RoundGothic are supersets; PH pages lose nothing |
| NTC MC 07-12-2014 Annex 8-1 §3.3.2, §5.14.8; ABNT NBR 15608-2 | PH stream audio is MPEG-4 AAC, `audio/X-arib-mpeg4-aac`, stream type 0x11 | the demuxer reports `audioCodec` and `labelAgrees`: the band also sends ADTS at 0x11 (ALLTV, 2026-11-01) and MPEG-1 Layer II elsewhere, so the host sniffs instead of trusting the label |
| NTC MC 07-12-2014 Annex 5-1 §19.2 and Table 35; ABNT NBR 15608-3 Tables 35 and 36 | the TOT field is the national time (PH UTC+8); Table 36 is deleted and its three fields are 0 | the engine reports the field and the descriptor **verbatim**; the host chooses "as sent" or "the box" (which adds 480). Measured 2026-10-31: TV5 local with 0 offsets, GMA UTC, ALLTV BRA, RPTV TDT only; our 2023 TV5 captures declare +8:00, a vintage difference |
| ABNT NBR 15608-2 §7.2.9 | TOT is PID 0x0014, `table_id` 0x73 | parsed there |

The profile does not settle the ñ width, and the TOT field's reading rests on a line of the annex that
does not name the fields it covers. Both are reported, not corrected.
