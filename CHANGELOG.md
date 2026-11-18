# Changelog

All changes against upstream `tsukumijima/web-bml` (fork point `faf4d96`, which merges `otya128:master`).

## 1.3.0 - 2026-11-19

The version restarts: the upstream generation is **1** (this fork has never taken an upstream update since
`faf4d96`), so the old 2.x and 3.x lines are 1.2 and 1.3, and the previous 3.2.0 code is **1.3.0**.
Additive: the same engine, renumbered.

What 1.3 contains:

- **EWBS** — the 139-code Philippine allocation, zone and nationwide alerts, and an alert that ends when
  its descriptor leaves the PMT.
- **NVRAM and the receiver area** — 4 KB PH areas, the BS path form, `receiverAreaCode` /
  `setReceiverAreaCode`, and `setReceiverPostalCode` for Japanese streams.
- **Clock** — the TOT field reported verbatim, a default that follows the box, and "as the stream says"
  as one host setting.
- **Media** — the PH media types accepted by type, and `labelAgrees` when the band's label and the
  payload's codec disagree.
- **Text and charset** — decoding by the declared charset, the ARIB text designation rules, and UTF-8 PH
  text.
- **Pointer** — `clickAt` / `elementAt` over a closed shadow root, with the `--nav-index` and Enter-key
  path.
- **Fonts** — BML-PH Sans in six slots, Sans Lite for a tight budget, RoundGothic as an opt-in look.
- **The single-file bundle** — an IIFE build for hosts that load one script.

## Earlier (1.1 - 1.2)

1.1 was the port itself: PH text coding and media types, the 139-code area table with its EWBS mapping,
the broadcast clock offset, NVRAM sizing for PH receivers, and the faces built for the BML cell. 1.2
made the receiver area a first-class value (`receiverAreaCode` and its whole-set setter), fixed the BIT
forward and the clock default, and closed the 1.2 defects around affiliation, the clock and NVRAM.
