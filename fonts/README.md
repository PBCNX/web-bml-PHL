# The fonts

Every face the engine ships. They live in `node_modules/web-bml/fonts/`; a host copies the ones it
registers into its static path (see [`../docs/HOSTING.md`](../docs/HOSTING.md)).

## The profile faces (2.4.0)

| family | file | woff2 | ttf | covers |
|---|---|---|---|---|
| **BML-PH Sans** | `BMLPH-Sans-Regular.woff2` / `.ttf` | 1.09 MB | 2.4 MB | JIS 1+2, Latin-1/A/B, half-width kana, Greek, Cyrillic, symbols, `₱`, `࿖` |
| **BML-PH Sans Bold** | `BMLPH-Sans-Bold.woff2` / `.ttf` | 1.11 MB | 2.4 MB | the bold cut |
| **BML-PH Sans Lite** | `BMLPH-SansLite-Regular.woff2` / `.ttf` | 0.58 MB | 1.3 MB | JIS level 1, same scripts |
| **BML-PH Sans Lite Bold** | `BMLPH-SansLite-Bold.woff2` / `.ttf` | 0.58 MB | 1.3 MB | lite bold cut |
| **BML-PH RoundGothic** | `BMLPH-RoundGothic-Regular.woff2` / `.ttf` | 1.37 MB | 3.0 MB | the Kosugi/maru look, same coverage; no bold cut |

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

## Deprecated — removed in 3.0.0

These still ship for hosts that register them by name, and are gone in 3.0.0:

| family | file | what it was |
|---|---|---|
| `丸ゴシック`, `角ゴシック` | `MPLUS1Code-Regular.woff2` | the old M+ look |
| `太丸ゴシック` | `MPLUS1Code-Bold.woff2` | the old bold |
| `BML Fallback` | `MPLUS1P-Regular.woff2` | full-width forms, half-width kana, symbols |
| `BML Last Resort` | `KosugiMaru-Regular.woff2` (+ `Kosugi-Regular.woff2`, `KosugiMaru-Bold.woff2`) | upstream's BML face |
| `PH Latin` | `PHLatin-Regular.woff2` | the old Latin fallback |

After 3.0.0 all six option keys point at `BMLPH-Sans-Regular.woff2` (and `-Bold` for bold), because the
accents and every non-PUA JIS character are inside the face.

## Licences

- BML-PH Sans / RoundGothic: SIL Open Font License 1.1 (`OFL-BMLPH-Sans.txt`), derived from the Noto
  families; RoundGothic's base Kosugi Maru is Apache-2.0 (`LICENSE.txt`, `AUTHORS.txt`,
  `CONTRIBUTORS.txt`).
- The deprecated M+ and Kosugi files carry their own notices in `OFL-MPLUS1Code.txt` and `LICENSE.txt`.
