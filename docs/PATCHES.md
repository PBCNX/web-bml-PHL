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
| C11 | `audio/X-arib-mpeg4-aac` | engine side done |
| C12 | `video/X-arib-H264-high` | engine side done |
| C13 | monospaced face covering PH text | engine side done |
| C14 | 139 EWBS area codes, coverage | done |
| C15 | NVRAM areas at 4 KB | engine side done |
| C16 | the TOT time is the broadcast local time (PH: UTC+8; descriptor deleted, Table 36) | done |

## The numbers

- **Areas**: the coverage rule was one-directional and disagreed with the reference receiver on
  **391 of 19,321** city pairs; it is symmetric now.
- **Text**: of 111 valid UTF-8 `.btb` fields, 61 were garbled before P7; of 144 tables, none carries a
  C1 control.
- **Fonts**: Kosugi has the right cell (0.5 em ASCII) but **3 of 64** Latin-1 letters; the M+ pair
  covers **1,092 of 1,094** characters, the miss being `霾` — hence Kosugi as the last resort.
  Symbols in M PLUS 1P are **0.62–1.02 em**, so symbol runs can move slightly; nothing else moves.
- **Clock**: TV5 and `preview.ts` declare **+480**; `GMA-BML.ts` declares country PHL with **0**, read
  as +480; a Japanese stream with no descriptor stays unknown.
- **Corpus**: 65 PH page files — 644,473 ASCII, 26 hiragana, 37 katakana, 14 CJK, no Latin-1 letters
  (the `ñ` lives in the `.btb` text tables).

The repository carries none of the captures these were measured on.
