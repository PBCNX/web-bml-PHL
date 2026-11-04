# NOTICE

web-bml-PHL is derived work, and this page is the readable map of it: who owns what, where every part
came from, and which third-party work is bundled. The binding terms are [`LICENSE.md`](LICENSE.md) for the
engine and the notices under [`fonts/`](fonts/) for the font software.

## Owner and marker

| | |
|---|---|
| project | web-bml-PHL, maintained by **PBCNX** |
| project author | **The web-bml-PHL Authors (PBCNX)**, the copyright line in [`LICENSE.md`](LICENSE.md) |
| public repository | `PBCNX/web-bml-PHL` |
| working repository | private, and not part of this tree |
| **provenance marker** | `web-bml-phl-pbcnx` |

The marker is a **visible attribution string, not telemetry**. It is exported as `PROVENANCE` from the
engine's leaf contracts and carried in `getDiagnostics().provenance`, so a host's diagnostic report says
which project it came from. It performs no network or device I/O, carries no user or device identifier,
and changes no protocol bytes. It exists so the origin is searchable and so the notices travel with
copies.

## Ownership

| part | copyright | licence |
|---|---|---|
| upstream engine | Copyright (c) 2022 otya — [otya128/web-bml](https://github.com/otya128/web-bml), the original; this fork descends from [tsukumijima/web-bml](https://github.com/tsukumijima/web-bml), its KonomiTV fork | MIT |
| this fork (changes, protocol layer, PH profile, fonts pipeline) | Copyright (c) 2026 The web-bml-PHL Authors (PBCNX) | MIT |
| `BMLPH-Sans-*`, `BMLPH-SansLite-*` and the chunks | Copyright (c) 2026 The web-bml-PHL Authors (PBCNX) (modifications); derived from Noto, Copyright (c) Google LLC | SIL OFL 1.1 |
| `BMLPH-RoundGothic-Regular.*` | Kosugi Maru, Copyright (c) Motoya Font (Apache-2.0); Huninn, Copyright (c) justfont (OFL 1.1); Noto fillers, Copyright (c) Google LLC (OFL 1.1); modifications Copyright (c) 2026 The web-bml-PHL Authors (PBCNX) | Apache-2.0 AND OFL-1.1 |

Both engine lines are in [`LICENSE.md`](LICENSE.md); the fork keeps upstream's licence and adds its own.
The font notices ship as [`fonts/OFL-BMLPH-Sans.txt`](fonts/OFL-BMLPH-Sans.txt),
[`fonts/LICENSE.txt`](fonts/LICENSE.txt), [`fonts/AUTHORS.txt`](fonts/AUTHORS.txt),
[`fonts/CONTRIBUTORS.txt`](fonts/CONTRIBUTORS.txt) and [`fonts/NOTICE.txt`](fonts/NOTICE.txt), and
`fonts/package.json` lists every one of them in `files`.

A contribution is accepted under the licence of the file it touches: MIT for the engine, OFL 1.1 for new
glyphs in the Sans faces, and the source face's terms for anything copied into RoundGothic. Do not add a
font file without its notice.

## The engine

| | |
|---|---|
| upstream | [tsukumijima/web-bml](https://github.com/tsukumijima/web-bml) (fork point `faf4d96`, which merges `otya128:master`), MIT; [otya128/web-bml](https://github.com/otya128/web-bml) is the original |
| fork point | `faf4d96` — the `master` branch here is that commit and never moves |
| this fork | `main`, see [`CHANGELOG.md`](CHANGELOG.md); `legacy/1.1.x` frozen at 1.1.5 |
| build | `tsc` writes the committed `dist/`; `test/dist-hygiene.test.mjs` checks it matches the sources |
| every change | listed in [`docs/PATCHES.md`](docs/PATCHES.md) with its source and, where it matters, its numbers |

`es2/` is the ECMAScript evaluator vendored from upstream, not written here.

`vendor/css/` is [reworkcss/css](https://github.com/reworkcss/css) 3.0.2, MIT, as forked by
otya128 and pinned by the engine; its licence is `vendor/css/LICENSE`. It is vendored rather than
depended on by URL because npm 12 refuses to fetch remote-tarball dependencies by default, which
made `npm ci` fail on a clean clone.

## The fonts

| source | used for | licence | source revision |
|---|---|---|---|
| Noto Sans, Noto Sans Mono CJK JP, Noto Sans Symbols, Noto Sans Symbols 2, Noto Sans Math, Noto Serif Tibetan | base of BML-PH Sans / Lite | OFL 1.1 | Google Noto release used for the 2.1.0 build |
| Huninn | rounded filler glyphs | OFL 1.1 | justfont release |
| Kosugi Maru | base of BML-PH RoundGothic | Apache-2.0 | `googlefonts/kosugi-maru` `bd22c671a9ffc10cc4313e6f2fd75f2b86d6b14b` |

The cell rules (Latin and half-width kana 0.5 em with ink inside the cell and accents matched to their
base; Greek and Cyrillic 1 em, one scale per script; kana, kanji, `U+3000` and `℃` 1 em) are stated in
[`fonts/README.md`](fonts/README.md) and measured by the font suites and the layout probe.

### Shipped files

SHA-256, so a rebuild can be compared rather than assumed:

```
862D713BF8B59776198BE0765EA0F06ED29F509AA70947BA5AEABCBDB72DD3E0  BMLPH-RoundGothic-Regular.ttf
8CCFB450952B204DEB8E5E855173C5DFC8B7C8696E2A502D648AED3EA3189A90  BMLPH-RoundGothic-Regular.woff2
4155D951CD6C04BE76EA820E099FAFCDEF733F23164807C76220E4416B1B4124  BMLPH-Sans-Bold.ttf
D3E4E86BD21598C682359696680222F1A2D0EB85B479AA5EA1C9333BA409034B  BMLPH-Sans-Bold.woff2
E2F6F9E5A06D6860815572EB0DC59CEFDEA3D935C12CA56FC56776AB1E2F9092  BMLPH-Sans-cjk.woff2
D4766A1AB7F00AA278A0612DCB845CEB6AE4659F450C5DCBEF8EC2715B0175A9  BMLPH-Sans-kana.woff2
A384A8FFCD1CCDBF97E266C2EF4A74A2FA384ACD86CE22EC2174FE42A7B80FEF  BMLPH-Sans-latin-ph.woff2
E58FF1F0457927E655A292B031E9F8F919AF2428FA19B807053F26148A20FDB8  BMLPH-Sans-Regular.ttf
0757C3B454D9A319F43B52143A9D51F732EE55D5222FEFB90AEB2B1A783D5980  BMLPH-Sans-Regular.woff2
9145E23C672EB3671400365C6EE19679D1E1A9B285597CF08E7A2FF85D245C64  BMLPH-Sans-symbols.woff2
32638E837AD190B74DE0F7E0DB0A7023410F224E95246C0E67B2CDA87F71F163  BMLPH-SansLite-Bold.ttf
653FB440107459ED1E917ACF939D27A2C4D10ADBAA4E0F792C93B3C6460D994A  BMLPH-SansLite-Bold.woff2
BF6F78F819D46B3FAD4C0F99B0BD97E51F5E5517FCD2F792CF383E2DDB212722  BMLPH-SansLite-Regular.ttf
1551D7D53903C46102AF146EADDD5E01E22C0FDAB0D099A37621EAC899D515F6  BMLPH-SansLite-Regular.woff2
```

## The measurements

Every claim in [`docs/PATCHES.md`](docs/PATCHES.md) names the material it was measured on. That material
is **not in this repository** — no captures, no saved carousels, no broadcaster page files. The main
ones:

| name | what it is |
|---|---|
| `GMA-BML.ts` | GMA, 479.143 MHz, H.264 + AAC, a page that loads |
| TV5 captures | 497.143 MHz, two vintages of the TOT form |
| `ABSBML/3201` | ABS-CBN Panay 2019, incomplete dump (missing `/50/1002`, `/60/1003`) |
| `ABS-BML/…/panay2` | the complete Panay 2019 extraction |
| `BS-TBS_20230115-175120.ts` | BS-TBS service 161: no component 60, BIT without affiliations |
| live sweeps | receiver-side clock and area sweeps, notes only |

A capture shows what one station sent at one time; it never changes what a rule says.

## What is deliberately absent

- **Broadcaster content** — pages, carousels, EPG, images, audio. None of it.
- **Capture-derived fixtures** — every fixture in `test/fixtures/` is hand-written, so the suite runs on
  a clean clone.
- **The private working repository** — coordination notes, host reports and session records stay outside
  this tree; [`docs/PATCHES.md`](docs/PATCHES.md) is the public summary of what they changed.

## Releasing

The working clone commits, builds the release tree, and commits it on the public repository's `main` —
whose history begins at upstream `master` — then tags that commit. The private `public-mirror` orphan
branch is the reviewed snapshot of the same tree. `tools/publish-check.mjs` gates it, and
[`docs/RELEASING.md`](docs/RELEASING.md) has the exact commands.
