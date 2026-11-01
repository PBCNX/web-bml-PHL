# web-bml-PHL

A BML data-broadcasting engine for the web, with the **Philippine ISDB-T profile**.

This is a fork of [otya128/web-bml](https://github.com/otya128/web-bml) (MIT). Upstream's engine is
kept as-is; this fork adds the changes a receiver needs to run the BML Philippine broadcasters send.

## Branches

| branch | version | what it is |
|---|---|---|
| **`main`** | **3.0.0** | the refactored engine — packages, protocol layer, EWBS, both faces, 213 tests |
| **`legacy/1.1.x`** | **1.1.5** | the previous stable line, kept for rollback |
| **`master`** | upstream | the fork point; this fork never commits to it |

`v2.4.0` is the last tree that carries the old M+/Kosugi font files; nothing else changes at 3.0.0.

## What it changes

- **Charset** — a document is decoded by the charset it declares, not by a guess.
- **ARIB text** — `.btb` text follows its own designation rules; PH text is UTF-8.
- **EWBS areas** — the 139-code Philippine allocation, with coverage read the way the reference
  receiver reads it (a nationwide alert reaches everyone; a zone alert covers its regions and cities).
- **Clock** — the TOT's time field and its descriptor are reported **verbatim**. The profile
  (NTC MC 07-12-2014 Annex 5-1 §19.2, Table 35) makes the field the national time, UTC+8, with the
  three Table 36 fields at 0; the host chooses whether to show the field as sent or follow the box,
  which adds 480 minutes. See [`docs/HOSTING.md`](docs/HOSTING.md#clock).
- **Media** — the PH types (`video/X-arib-H264-high`, `audio/X-arib-mpeg4-aac`) are accepted by type,
  alongside the Japanese ones broadcasters still send.
- **Audio labels** — the demuxer sniffs the payload and reports `codec`, `expectedCodec` and
  `labelAgrees`, because the band labels one codec and carries another (ALLTV sends ADTS under the
  LATM label). The facts are in the `audioCodec` message and in `getDiagnostics().audioCodecs`.
- **NVRAM** — the areas can be sized for the PH services (4 KB each), and the affiliation may arrive
  as a path segment (`nvram:///03/group/30`), as BS-TBS writes it.
- **Pointer** — `clickAt(x, y)` and `elementAt(x, y)` treat a pointer as the remote: closed shadow
  root, `--nav-index` owner, the same `focus` → `click` → `href` path the Enter key takes.
- **Typeface** — **BML-PH Sans** (Noto Sans Mono CJK JP derived) in all six slots, with
  **BML-PH Sans Lite** for a tight budget and **BML-PH RoundGothic** (Kosugi-based) as an opt-in
  setting. The ARIB family names stay, because pages and DRCS glyphs use them; putting the maru face
  in `roundGothic` would make every unlabelled page rounded, which is the spec's initial value but
  not the look this profile ships by default.

Each change, its source and the measurement behind it: [`docs/PATCHES.md`](docs/PATCHES.md).

## Install

```sh
npm install github:PBCNX/web-bml-PHL#main            # 3.0.0
npm install github:PBCNX/web-bml-PHL#legacy/1.1.x    # 1.1.5
```

The package ships the faces in `node_modules/web-bml/fonts/`. A host copies the ones it registers
into its static path and registers them — see [`docs/HOSTING.md`](docs/HOSTING.md).

## Test

```sh
npm ci && npm run build && npm test
```

213 tests (182 pass; 31 skip without captures). No network. The layout half of the font check lives in
[`test/fixtures/layout-cell-probe.html`](test/fixtures/layout-cell-probe.html) — it must await
`document.fonts.load()` and be served over HTTP.

## Docs

- [`docs/HOSTING.md`](docs/HOSTING.md) — what a host wires: options, fonts, clock, NVRAM, audio, pointer.
- [`docs/PATCHES.md`](docs/PATCHES.md) — the conformance record, with the citations behind each change.
- [`CHANGELOG.md`](CHANGELOG.md) — per release.
- [`fonts/README.md`](fonts/README.md) — the faces and their files.
- [`docs/RELEASE-3.0.0.md`](docs/RELEASE-3.0.0.md) — what this major removes and why.

The repo carries **no broadcaster content**.

## Licence

MIT, upstream's [`LICENSE`](LICENSE) kept. The fonts are under SIL OFL 1.1
([`fonts/OFL-BMLPH-Sans.txt`](fonts/OFL-BMLPH-Sans.txt), [`fonts/LICENSE.txt`](fonts/LICENSE.txt)).
