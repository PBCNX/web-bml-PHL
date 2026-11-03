# web-bml-PHL — BML data broadcasting for the Philippine ISDB-T profile

A browser engine for **BML** (ARIB STD-B24), the data-broadcasting layer of ISDB-T, with the
**Philippine profile**: the 139-code EWBS area allocation, PH text coding, the PH media types, the
broadcast clock, and a monospaced face built for the BML cell.

This is a fork of [otya128/web-bml](https://github.com/otya128/web-bml) (MIT). Upstream's engine is kept
as-is; the fork adds what a receiver needs to run the pages Philippine broadcasters actually send.

## Status

| | |
|---|---|
| engine | **3.0.0** on `main`; `legacy/1.1.x` frozen at 1.1.5 for rollback |
| tests | **232** — 201 pass, 31 skip (capture-backed tests skip on a clean clone), no network |
| bundle | `dist-iife/bml.js` 1.4 MiB (esbuild, one script) |
| fonts | 5.7 MiB of `woff2` for both looks in the package; the `ttf` files are in the repository for Windows install |
| hosts run it | BMLPlayer, OpenDTV-MOD, BaronTV, TVTest-PHL — all on 2.6.x, 3.0.0 is API-identical |
| provenance | **The web-bml-PHL Authors (PBCNX)** · marker `web-bml-phl-pbcnx` (attribution, not telemetry) |

## What the profile needs, and what this engine does

| rule | what the engine does |
|---|---|
| **Charset** | a document is decoded by the charset it declares, not by a guess |
| **ARIB text** | `.btb` text follows its designation rules; PH text is UTF-8, and C1 controls take no cell |
| **EWBS** | the 139-code PH allocation; a nationwide alert reaches everyone, a zone alert covers its regions and cities; an alert ends when its descriptor leaves the PMT |
| **Clock** | the TOT field and its descriptor are reported verbatim; the default follows the box (+480) and "as the stream says" is one host setting |
| **Media** | `video/X-arib-H264-high` and `audio/X-arib-mpeg4-aac` accepted by type; the demuxer sniffs the audio payload and reports `labelAgrees`, because the band labels one codec and carries another |
| **NVRAM** | 4 KB PH areas, the BS path form (`nvram:///03/group/30`), and the receiver area as a first-class value (`receiverAreaCode`, `setReceiverAreaCode`) |
| **Pointer** | `clickAt(x, y)` / `elementAt(x, y)`: closed shadow root, `--nav-index` owner, the Enter-key path |
| **Typeface** | **BML-PH Sans** in all six slots, **Sans Lite** for a tight budget, **RoundGothic** as an opt-in look |

Each change, its source and the measurement behind it: [`docs/PATCHES.md`](docs/PATCHES.md).
Where all of it comes from: [`NOTICE.md`](NOTICE.md).

## Install

```sh
# npm 12 sets allow-git=none, so name the permission once per install:
npm install --allow-git=all github:PBCNX/web-bml-PHL#v3.0.0   # 3.0.0

# npm 11 and earlier:
npm install github:PBCNX/web-bml-PHL#v3.0.0                  # 3.0.0
# the old line, for a 1.1 host:
npm install github:PBCNX/web-bml-PHL#legacy/1.1.x            # 1.1.5
```

Pin the tag rather than `#main`: a tag is what the release notes and the checks above describe.

The faces ship in `node_modules/web-bml/fonts/`. A host copies the ones it registers into its static
path and registers them — [`docs/HOSTING.md`](docs/HOSTING.md) has the six keys, the clock setting and the
pointer seam.

## Test

```sh
npm ci && npm run build && npm test
```

The layout half of the font check lives in [`test/fixtures/layout-cell-probe.html`](test/fixtures/layout-cell-probe.html):
it must await `document.fonts.load()` and be served over HTTP, or it measures the fallback instead of
the face.

## Repository

```
client/        the engine: DOM, CSS, text, NVRAM, EWBS, interpreter bindings
server/        transport-stream demux and the protocol messages it emits
protocol/      the message vocabulary and the media-type rules
es2/           the ECMAScript evaluator, vendored from upstream
dist/          committed build output, checked by test/dist-hygiene.test.mjs
fonts/         the two faces, their chunks and their notices
docs/          hosting, conformance, releasing, the 3.0.0 record
test/          node:test suites, no network, no broadcaster content
```

## Docs

- [`docs/HOSTING.md`](docs/HOSTING.md) — options, fonts, clock, NVRAM, receiver area, audio, pointer.
- [`docs/PATCHES.md`](docs/PATCHES.md) — the conformance record and its citations.
- [`docs/RELEASING.md`](docs/RELEASING.md) — private first, public second, and the gate.
- [`fonts/README.md`](fonts/README.md) — the faces and their files.
- [`CHANGELOG.md`](CHANGELOG.md) — per release.
- [`NOTICE.md`](NOTICE.md) — ownership, provenance, the third-party work and the marker.

The repo carries **no broadcaster content**.

## Licence

The engine is **MIT** (upstream's licence kept, the fork's copyright added): [`LICENSE.md`](LICENSE.md).
The fonts are mixed — OFL 1.1 for BML-PH Sans and the Noto/Huninn sources, Apache-2.0 for the Kosugi
base of RoundGothic. [`NOTICE.md`](NOTICE.md) maps each file to its holder and notice;
[`fonts/NOTICE.txt`](fonts/NOTICE.txt) carries the third-party notices.
