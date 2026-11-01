# The fonts

Every face the profile uses. The engine package carries them in `node_modules/web-bml/fonts/`; a
host copies the ones it registers into its static path (see [`../docs/HOSTING.md`](../docs/HOSTING.md)).

| family the CSS names | file | what it is |
|---|---|---|
| `丸ゴシック`, `角ゴシック` | `MPLUS1Code-Regular.woff2` | the profile's look: 0.5 em Latin with accents, 1.0 em kana/kanji |
| `太丸ゴシック` | `MPLUS1Code-Bold.woff2` | the bold face |
| `BML Fallback` | `MPLUS1P-Regular.woff2` | full-width forms, half-width kana, symbols |
| `BML Last Resort` | `KosugiMaru-Regular.woff2` | the one character no M+ face has (`霾`, U+972D) |
| `PH Latin` | `PHLatin-Regular.woff2` | the conservative path's Latin fallback |

The ARIB family names are the page-visible contract — a page's CSS and the DRCS glyph map use them.
The face behind a name is the host's choice.

Kosugi (`Kosugi-Regular.woff2`, `KosugiMaru-Regular.woff2`, `KosugiMaru-Bold.woff2`) is upstream's
BML face: monospaced at 0.5 em, no Latin accents.

Licences: SIL OFL 1.1 for the M PLUS and Kosugi families (`OFL-MPLUS1Code.txt`, `LICENSE.txt`);
the Kosugi files also carry Apache-2.0 terms as shipped (`AUTHORS.txt`, `CONTRIBUTORS.txt`).

## BML-PH Sans and BML-PH Sans Lite (2.1.0)

The PH face. Derived from Noto Sans Mono CJK JP (OFL), with the BML cell enforced on every Latin
letter: advance 500/1000, ink centred and inside the cell, accented letters matched to their base
letter's width. Kana, kanji and U+3000 are 1 em; `℃` is 1 em; the full face carries `霾` (U+972D).

| family | file | size | covers |
|---|---|---|---|
| `BML-PH Sans` | `BMLPH-Sans-Regular.woff2` (or `.ttf`) | 954 KB / 2.0 MB | JIS level 1+2, 7,401 glyphs |
| `BML-PH Sans Lite` | `BMLPH-SansLite-Regular.woff2` (or `.ttf`) | 431 KB / 0.4 MB | JIS level 1, 3,509 glyphs |

`BMLPH-Sans-{latin-ph,kana,cjk,symbols}.woff2` are unicode-range chunks of the full face for hosts
that want to load kanji on demand. The `.ttf` files are for Windows install (Settings > Fonts lists
both families).

The M+/Kosugi/PHLatin files above stay for compatibility with hosts that already register them;
they are deprecated as of 2.1.0 and will be removed in 3.0.0. Licence: `OFL-BMLPH-Sans.txt`
(SIL Open Font License 1.1, Noto).

## BML-PH Sans 2.2.0 — the script set

The same face, now with the scripts BML pages actually mix:

| family | file | size | covers |
|---|---|---|---|
| `BML-PH Sans` | `BMLPH-Sans-Regular.ttf/.woff2` | 2.0 MB / 954 KB | JIS 1+2, Latin, **half-width kana**, **Greek**, **Cyrillic**, **₱** |
| `BML-PH Sans Bold` | `BMLPH-Sans-Bold.ttf/.woff2` | 2.0 MB / 960 KB | the bold cut |
| `BML-PH Sans Lite` | `BMLPH-SansLite-Regular.ttf/.woff2` | 0.44 MB / 440 KB | JIS level 1, same scripts |
| `BML-PH Sans Lite Bold` | `BMLPH-SansLite-Bold.ttf/.woff2` | 0.44 MB / 440 KB | lite bold cut |

Cell rules: Latin and half-width kana **0.5 em** (advance 500, ink centred inside the cell, accents
matched to their base letter); Greek and Cyrillic **1.0 em** (advance 1000, ink fitted and centred);
kana/kanji/`U+3000`/`℃` **1.0 em**. `₱` (U+20B1) is 0.5 em. Greek has 23 archaic codepoints no
source ships; Cyrillic and half-width kana are complete.

## BML-PH RoundGothic (2.3.0)

The Kosugi/maru look, with the same cell and the same coverage contract. Base: **Kosugi Maru**
(Apache-2.0), upem scaled to 1000; the characters Kosugi lacks come from Huninn, Noto Sans, Noto Sans
Mono CJK JP, Noto Sans Symbols/2, Noto Sans Math and Noto Serif Tibetan (for `࿖`).

| family | file | size | covers |
|---|---|---|---|
| `BML-PH RoundGothic` | `BMLPH-RoundGothic-Regular.woff2` (or `.ttf`) | 1.34 MB / 2.9 MB | JIS 1+2, Latin, kana, Greek/Cyrillic, symbols |

Cell rules are the Sans rules: Latin and half-width kana 0.5 em with ink inside the cell and accents
matched to their base letter, Greek/Cyrillic 1 em one size per script, kana/kanji/U+3000/℃ 1 em,
`₱` 0.5 em. JIS: **0 non-PUA characters missing**. There is no bold cut (Kosugi has none); let CSS
synthesize it.

Register it under the same option keys as Sans — it is a look, not a different API.