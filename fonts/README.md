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
