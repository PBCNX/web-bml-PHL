# web-bml-PHL

A BML data-broadcasting engine for the web, with the **Philippine ISDB-T profile**.

This is a fork of [otya128/web-bml](https://github.com/otya128/web-bml) (MIT). Upstream's engine is
kept as-is; this fork adds the changes a receiver needs to run the BML Philippine broadcasters send.

## Branches

| branch | version | what it is |
|---|---|---|
| **`main`** | **2.0.0** | the refactored engine — packages, protocol layer, EWBS work, 201 tests |
| **`legacy/1.1.x`** | **1.1.1** | the previous stable line, kept for rollback |
| **`master`** | upstream | the fork point; this fork never commits to it |

## What it changes

- **Charset** — a document is decoded by the charset it declares, not by a guess.
- **ARIB text** — `.btb` text follows its own designation rules; PH text is UTF-8.
- **EWBS areas** — the 139-code Philippine allocation, with coverage read the way the reference
  receiver reads it (a nationwide alert reaches everyone; a zone alert covers its regions and cities).
- **Clock** — page time comes from the stream's offset, not from Japan time. PH is +8:00, including a
  stream that declares the country with a zero offset.
- **Media** — the PH types (`video/X-arib-H264-high`, `audio/X-arib-mpeg4-aac`) are accepted by type,
  alongside the Japanese ones broadcasters still send.
- **NVRAM** — the areas can be sized for the PH services (4 KB each).
- **Typeface** — M PLUS 1 Code / M PLUS 1P as the profile's look, Kosugi as the last resort. The ARIB
  family names stay, because pages and DRCS glyphs use them.

Each change, its source and the measurement behind it: [`docs/PATCHES.md`](docs/PATCHES.md).

## Install

```sh
npm install github:PBCNX/web-bml-PHL#main            # 2.0.0
npm install github:PBCNX/web-bml-PHL#legacy/1.1.x    # 1.1.1
```

The package ships the faces in `node_modules/web-bml/fonts/`. A host copies the ones it registers
into its static path and registers them — see [`docs/HOSTING.md`](docs/HOSTING.md).

## Test

```sh
npm ci && npm run build && npm test
```

59 tests on `legacy/1.1.x`, 201 on `main` (the capture-backed ones skip without captures). No network.

## Docs

- [`docs/HOSTING.md`](docs/HOSTING.md) — what a host wires: options, fonts, clock, NVRAM, audio.
- [`docs/PATCHES.md`](docs/PATCHES.md) — the conformance record.
- [`CHANGELOG.md`](CHANGELOG.md) — per release.
- [`fonts/README.md`](fonts/README.md) — the faces and their files.

The repo carries **no broadcaster content**.

## Licence

MIT, upstream's [`LICENSE`](LICENSE) kept. The fonts are under SIL OFL 1.1
([`fonts/OFL-MPLUS1Code.txt`](fonts/OFL-MPLUS1Code.txt), [`fonts/LICENSE.txt`](fonts/LICENSE.txt)).
