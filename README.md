# web-bml-PHL

A browser engine for BML (ARIB STD-B24 data broadcasting) with the Philippine ISDB-T profile.

A fork of [tsukumijima/web-bml](https://github.com/tsukumijima/web-bml) (itself a fork of
[otya128/web-bml](https://github.com/otya128/web-bml)), MIT. Upstream's engine is kept as it is; this
fork adds what a receiver needs to run the pages Philippine broadcasters actually send.

## Requirements

- Node.js v22 or v24
- a recent Firefox or Chromium-based browser

## Install

```sh
# npm 12 sets allow-git=none, so name the permission once per install:
npm install --allow-git=all github:PBCNX/web-bml-PHL#v1.3.0

# npm 11 and earlier: the same pin, without the flag
npm install github:PBCNX/web-bml-PHL#v1.3.0
```

Pin the tag, not `#main`: a tag is what the release notes describe. This is release **1.3.0**.

## Build and test

```sh
npm ci && npm run build && npm test
```

## What it adds

- **Charset** — a document is decoded by the charset it declares, not by a guess.
- **ARIB text** — `.btb` text follows its designation rules; PH text is UTF-8, and C1 controls take no
  cell.
- **EWBS** — the 139-code Philippine allocation: a nationwide alert reaches everyone, a zone alert
  covers its regions and cities, and an alert ends when its descriptor leaves the PMT.
- **Clock** — the TOT field and its descriptor are reported verbatim; the default follows the box
  (+480), and "as the stream says" is one host setting.
- **Media** — `video/X-arib-H264-high` and `audio/X-arib-mpeg4-aac` are accepted by type, and the
  demuxer reports `labelAgrees` when the band's label and the payload's codec disagree.
- **NVRAM** — 4 KB PH areas, the BS path form, the receiver area as a first-class value
  (`receiverAreaCode`, `setReceiverAreaCode`), and the Japanese postal setter.
- **Pointer** — `clickAt(x, y)` / `elementAt(x, y)`: closed shadow root, `--nav-index`, the Enter-key
  path.
- **Typeface** — BML-PH Sans in all six slots, Sans Lite for a tight budget, RoundGothic as an opt-in
  look.

## Docs

- [`docs/HOSTING.md`](docs/HOSTING.md) — options, fonts, clock, NVRAM, receiver area, audio, pointer.
- [`docs/PATCHES.md`](docs/PATCHES.md) — the conformance record and its citations.
- [`fonts/README.md`](fonts/README.md) — the faces and their files.
- [`CHANGELOG.md`](CHANGELOG.md) — per release.
- [`NOTICE.md`](NOTICE.md) — ownership, provenance, the third-party work and the marker.

## License

The engine is **MIT** (upstream's license kept, the fork's copyright added):
[`LICENSE.md`](LICENSE.md). The fonts are mixed — OFL 1.1 for BML-PH Sans and the Noto/Huninn sources,
Apache-2.0 for the Kosugi base of RoundGothic; [`NOTICE.md`](NOTICE.md) maps each file to its holder and
notice.
