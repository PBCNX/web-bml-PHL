# The fonts

Every face the engine ships. They live in `node_modules/web-bml/fonts/`; a host copies the ones it
registers into its static path (see [`../docs/HOSTING.md`](../docs/HOSTING.md)).

## The profile faces (3.0.0)

| family | file | woff2 (MiB) | ttf (MiB) | covers |
|---|---|---|---|---|
| **BML-PH Sans** | `BMLPH-Sans-Regular.woff2` / `.ttf` | 1.06 | 2.37 | JIS 1+2, Latin-1/A/B, half-width kana, Greek, Cyrillic, symbols, `₱`, `࿖` |
| **BML-PH Sans Bold** | `BMLPH-Sans-Bold.woff2` / `.ttf` | 1.08 | 2.34 | the bold cut |
| **BML-PH Sans Lite** | `BMLPH-SansLite-Regular.woff2` / `.ttf` | 0.56 | 1.26 | JIS level 1, same scripts |
| **BML-PH Sans Lite Bold** | `BMLPH-SansLite-Bold.woff2` / `.ttf` | 0.57 | 1.24 | lite bold cut |
| **BML-PH RoundGothic** | `BMLPH-RoundGothic-Regular.woff2` / `.ttf` | 1.34 | 2.91 | the Kosugi/maru look, same coverage; no bold cut |

The family names are the page-visible contract: the ARIB names (`丸ゴシック`, `角ゴシック`, `太丸ゴシック`)
are what a page's CSS names, and the face behind them is the host's choice. **The default mapping is
uniform BML-PH Sans in all six slots** (decision 2026-11-02): the spec's initial `font-family` is
round gothic, so a page that names nothing would otherwise be rounded while the rest of the page is
square. BML-PH RoundGothic is the opt-in look — a host that ships it should offer it as a setting
(Kosugi has no bold, so CSS synthesizes it).

## The cell

- Latin and half-width kana: **0.5 em** (advance 500, ink centred inside the cell, accented letters
  matched to their base letter's width).
- Greek, Cyrillic, kana, kanji, `U+3000`, `℃`: **1.0 em**; Greek/Cyrillic keep one size per script.
- `₱` (U+20B1): 0.5 em.

JIS coverage is **0 non-PUA characters missing** in both looks. Outside JIS the only absent characters
are 14 Coptic-derived archaic Greek letters and 21 emoji-presentation symbols — no text source ships
them.

## Chunks

`BMLPH-Sans-{latin-ph,kana,cjk,symbols}.woff2` (45 / 31 / 897 / 119 KB) are unicode-range pieces of the
full face for hosts that want the browser to fetch kanji on demand. Register one `@font-face` per chunk
under the same family with its `unicode-range`; the `fonts` option takes one source per key, so chunking
is host CSS.

## Windows install

The `.ttf` files are for Windows: right-click → Install for all users; Settings → Fonts lists all five
families.

## Licences

- BML-PH Sans / RoundGothic: SIL Open Font License 1.1 (`OFL-BMLPH-Sans.txt`), derived from the Noto
  families; RoundGothic's base Kosugi Maru is Apache-2.0 (`LICENSE.txt`, `AUTHORS.txt`,
  `CONTRIBUTORS.txt`).
