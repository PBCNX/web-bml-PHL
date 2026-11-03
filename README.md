# web-bml-PHL

A BML data-broadcasting engine for the web, with the **Philippine ISDB-T profile**.

This is a fork of [otya128/web-bml](https://github.com/otya128/web-bml) (MIT). Upstream's engine is
kept as-is; this fork adds the changes a receiver needs to run the BML Philippine broadcasters send.

## Branches

| branch | version | what it is |
|---|---|---|
| **`main`** | **2.6.0** | the refactored engine — packages, protocol layer, EWBS, both faces, 226 tests |
| **`legacy/1.1.x`** | **1.1.5** | the previous stable line, kept for rollback |
| **`master`** | upstream | the fork point; this fork never commits to it |

## What it changes

- **Charset** — a document is decoded by the charset it declares, not by a guess.
- **ARIB text** — `.btb` text follows its own designation rules; PH text is UTF-8.
- **EWBS areas** — the 139-code Philippine allocation, with coverage read the way the reference
  receiver reads it (a nationwide alert reaches everyone; a zone alert covers its regions and cities).
- **Clock** — the TOT field and its descriptor are reported verbatim. The default follows the box
  (+480 for a PH stream, JST for a Japanese one, chosen by the stream's own identity); "as the stream
  says" is one host setting.
- **Media** — the PH types (`video/X-arib-H264-high`, `audio/X-arib-mpeg4-aac`) are accepted by type,
  alongside the Japanese ones broadcasters still send.
- **NVRAM** — the areas can be sized for the PH services (4 KB each), and the PH receiver area is a
  first-class value (`receiverAreaCode` / `setReceiverAreaCode`, resolved to zone/region/city).
- **Audio labels** — the demuxer sniffs the payload and reports `codec` / `expectedCodec` /
  `labelAgrees`, because the band labels one codec and carries another.
- **Pointer** — `clickAt(x, y)` / `elementAt(x, y)` treat a pointer as the remote.
- **Typeface** — **BML-PH Sans** (Noto Sans Mono CJK JP derived), with **BML-PH RoundGothic**
  (Kosugi-based) as the alternative look. The ARIB
  family names stay, because pages and DRCS glyphs use them.

Each change, its source and the measurement behind it: [`docs/PATCHES.md`](docs/PATCHES.md).

## Install

```sh
npm install github:PBCNX/web-bml-PHL#main            # 2.6.0
npm install github:PBCNX/web-bml-PHL#legacy/1.1.x    # 1.1.5
```

The package ships the faces in `node_modules/web-bml/fonts/`. A host copies the ones it registers
into its static path and registers them — see [`docs/HOSTING.md`](docs/HOSTING.md).

## Test

```sh
npm ci && npm run build && npm test
```

59 tests on `legacy/1.1.x`, 226 on `main` (the capture-backed ones skip without captures). No network.

## Docs

- [`docs/HOSTING.md`](docs/HOSTING.md) — what a host wires: options, fonts, clock, NVRAM, audio.
- [`docs/PATCHES.md`](docs/PATCHES.md) — the conformance record.
- [`CHANGELOG.md`](CHANGELOG.md) — per release.
- [`fonts/README.md`](fonts/README.md) — the faces and their files.
- [`docs/RELEASING.md`](docs/RELEASING.md) — private first, public second, and the gate between them.

The repo carries **no broadcaster content**.

## Licence

MIT, upstream's [`LICENSE`](LICENSE) kept. The fonts are under SIL OFL 1.1
([`fonts/OFL-BMLPH-Sans.txt`](fonts/OFL-BMLPH-Sans.txt), [`fonts/LICENSE.txt`](fonts/LICENSE.txt)).
