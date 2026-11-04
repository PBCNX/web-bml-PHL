# Hosting the engine

What a host wires up. The engine is a library: `new BMLBrowser(options)`, plus a few options.

## Options

| option | what it does |
|---|---|
| `textCoding` | `"auto"` (default, PH reading) or `"arib"` (strict Japanese reading) |
| `timeZoneOffsetMinutes` | the clock offset when the stream carries none; PH is `480` |
| `fonts` | the faces to register (below) |
| `nvramAreaBytes` | `4096` to size each NVRAM area for the PH services |
| `audioOutput` | the host's audio sink, if it has one |
| `configuration` | what the host reports in `getDiagnostics()` |

## Fonts

**2.1.0 and later: register `BML-PH Sans`.** It is the PH face — Noto Sans Mono CJK JP derived, with
the BML cell enforced on every Latin letter (advance 0.5 em, accents matched to their base width) and
kana/kanji/`U+3000` at 1 em. No `unicodeRange` trick is needed: the face draws `U+3000` at 1 em
itself.

```js
new BMLBrowser({
  fonts: {
    roundGothic:     { source: "url(/fonts/BMLPH-Sans-Regular.woff2)" },
    boldRoundGothic: { source: "url(/fonts/BMLPH-Sans-Bold.woff2)" },
    squareGothic:    { source: "url(/fonts/BMLPH-Sans-Regular.woff2)" },
    fallback:        { source: "url(/fonts/BMLPH-Sans-Regular.woff2)" },
    lastResort:      { source: "url(/fonts/BMLPH-Sans-Regular.woff2)" },
  },
});
```

`BMLPH-SansLite-Regular.woff2` is the same face with JIS level 1 only (0.56 MiB instead of 1.06 MiB) for
hosts with a tight budget; the family name is `BML-PH Sans Lite` and it registers the same way.
`BMLPH-Sans-{latin-ph,kana,cjk,symbols}.woff2` are unicode-range chunks of the full face for lazy
loading (register one `@font-face` per chunk with the matching `unicodeRange`).

The `.ttf` files are for Windows install (Settings > Fonts lists both families).

**2.3.0 adds the alternative look:** `BMLPH-RoundGothic-Regular.woff2` (family `BML-PH RoundGothic`,
Kosugi-based, same cell and coverage). There is no bold cut — CSS synthesizes it.

**Decision (2026-11-02): the default mapping is uniform Sans.** Point `roundGothic` at
`BMLPH-Sans-Regular.woff2` too, as in the block above. The spec's initial `font-family` is
`"丸ゴシック"` (STD-B24 A2-4.4.8), so a page that names nothing lands in the `roundGothic` slot; filling
that slot with the maru face makes every unlabelled page rounded, and mixing it with a square page is
a visible change from the single face hosts shipped before. Uniform Sans is a **deliberate departure
from that initial value**, recorded here so it is not "fixed" back by accident.

A host that ships both faces should offer the look as a **setting**, not a build: default
`BML-PH Sans`, option `BML-PH RoundGothic` in all six slots.


### Layout check (the half the font file cannot prove)

`fonts-ink.test.mjs` proves the glyph's ink stays inside its cell. It cannot prove that the browser
**advances** the widths a receiver advances — that was the M PLUS 1 Code bug, where U+3000 advanced
0.5 em and three padded layers collided.

`test/fixtures/layout-cell-probe.html` measures it. Serve the fonts directory over HTTP (a `file://`
font URL is blocked by the browser's font loader), then open:

```
http://127.0.0.1:<port>/layout-cell-probe.html?font=BML-PH%20Sans&file=/BMLPH-Sans-Regular.woff2
```

It prints a table and JSON to `#out` and `document.title`. **It must await `document.fonts.load()`**
before measuring — a probe that only waits for `document.fonts.ready` measures the fallback instead of
the face (every face then reports the same numbers, which is the tell). Pass at 32 px: A/0/ñ 16,
あ/日/U+3000 32, `AあA` 64, two U+3000 64.

### Stream identity (2.4.2)

`programInfo` is the identity a host should trust:

```js
{ type: "programInfo", networkId, originalNetworkId, transportStreamId, serviceId,
  serviceName, eventName, startTimeUnixMillis, durationSeconds, indefiniteDuration }
```

- `networkId` decides the region — Japanese satellite identities (`0x0004`, `0x0006/7`, `0x000A`,
  `0x000B/C`) and the terrestrial allocation (`0x7880–0x7FE8`); the PH muxes are outside both.
- `serviceName` (new) is the SDT's own name for the selected service, decoded; null until its SDT is
  seen. It is the cross-check for `networkId` and what a host displays.
- It is sent again whenever any field changes, so a tune or a file with a different service is not
  missed.

A host that plays a **file through a pseudo-tuner** (a UDP driver) has no real `ChannelInfo` — its
network id is 0 and its service list is not populated. Read `programInfo` instead of guessing from the
user's configured region: that is the difference between a Japanese capture rendered in the Philippine
face with its clock nine hours off, and one rendered as the stream says it is.
### Pointer input (2.4.0)

A host with a mouse or a touch pointer should call `clickAt(x, y)` rather than dispatching DOM clicks
or reaching into the navigation helpers:

```js
browser.clickAt(pageX, pageY);      // page CSS pixels; false when the page does not take the click
browser.elementAt(pageX, pageY);    // the same target without clicking, for a hover/cursor
```

Semantics that matter (they were learned from BMLPLAYER's Mouse mode):

- the page lives in a **closed shadow root**, so the hit test runs on that root, not `document`;
- only an element carrying an inherited `--nav-index` counts — the owner is resolved with the same
  navigation rule the remote uses, so a click on an image inside an object does not act as the object;
- a `false` return means the page did not take the click (page root, empty area, no nav-index) — fall
  back to the host's own chrome instead of pretending otherwise;
- it does what Enter does: `internalSetActive`, the synchronous `click` event, `processEventQueue`, and
  an anchor's `href` (launch or fragment).
## EWBS

The demuxer reports every alert as an `emergencyInfo` message (`serviceId`, `signalLevel`,
`areaCodes`) and reports the end of an alert as one more, with **`stopped: true`** and no areas.

- **Decide from `stopped`, never from `startEndFlag`.** `startEndFlag` is `false` both on an ended
  descriptor still in the PMT and on the final `stopped` message; only `stopped` is the end. An ended
  descriptor launches nothing and does not stand down a live alert.
- **A station that sets 0 but leaves the descriptor in the PMT** keeps the alert up until it removes it.
  That is a station fault, and it is safer than ending early.
- **TMCC.** The engine sees no TMCC, so it cannot apply the profile's test-transmission rule. A host that
  has TMCC should apply it there.
- **Area.** Compare `areaCodes` with the viewer's area code — `browser.receiverAreaCode` (the NVRAM
  value, 2.5.0) or the legacy `areaCode` option — using `areaCovers()` / `areaRelevant()`. A host
  that sets neither has no area and every alert is "relevant".
- **What the engine already does:** `getEwbsAlert()` is the alert in force (null when none),
  `getEwbsDecision()` is how the last message was judged, and the `ewbsDocument` option opens a page
  once per alert. Keep launching the alert page from the decision, not from the raw message.
## NVRAM

`nvramAreaBytes: 4096` sizes the affiliation and broadcaster areas the way the standard does. The
remaining areas keep their table size; the default is unchanged.

## PH profile — receiver area (2.5.0)

The viewer's own area is a **PBCNX extension**, declared here rather than implied:

| field | value |
|---|---|
| `nvram://receiverinfo/regioncode` | the **12-bit Philippine EWBS area code**, big-endian; low 12 bits; `0` = unset |
| `nvram://receiverinfo/prefecture` | `255` (unset) |
| `nvram://receiverinfo/zipcode` | empty |

Why it is defensible: in TR38 that field **is** a 12-bit area code (the Japanese use is an area code
too), and the PH allocation is also 12-bit and hierarchical (zone → region → city). The PH profile never
mapped its own allocation onto it — the community guide holds that as `the profile's open question`, status **unknown** —
and defines no other viewer-location field, so the alternative is that a PH page cannot know the
viewer's region at all.

Pages read it through the engine, not through the field layout:

```js
browser.receiverAreaCode;   // 0x421, or null when unset
browser.receiverArea;       // { code, kind: "city", name: "Caloocan",
                            //   zone: 0x400, zoneName: "Luzon",
                            //   region: 0x420, regionName: "NCR" }
```

`getDiagnostics().receiver` reports the same two things — the first place to look when a page shows the
wrong region. NVRAM stays the transport; the accessors are the friendly surface, so a future encoding
change is a host change that keeps pages working.

A host sets the code with **`browser.setReceiverAreaCode(code)`** (2.6.0), or `null`/`0` to clear it.
It writes the set as a whole — `regioncode` plus `prefecture` 255 and an empty `zipcode` — so a PH code
can never sit beside a leftover Japanese postal code, and it writes **nothing** when the stored set
already matches, because a host calls it at every session start and NVRAM wear is a real constraint
(NVRAM wear). It returns `true` when something was written.

Call it **when the receiver-info set changes**, not on every page load — and since 2.6.2 a call with
the same code writes nothing at all, so a page's own `zipcode` write is not erased by a host
re-asserting the same location. A change of code replaces the whole set, which is the point of the
convention.

**A host must choose the receiver-info set as a whole.** A Japanese stream never gets a Philippine code
(not even when no Japanese postal code is configured), and a Philippine stream gets the PH set. If hosts
disagree, the same page shows a different region on each receiver.
## Checking a configuration

`getDiagnostics()` returns the document and phase, locks, pending resources, table reads, script
errors, and `configuration` — the host's own report. That is the first thing to read when a page
looks wrong.

## Licence

The engine is MIT — [`LICENSE.md`](../LICENSE.md), with the fork's copyright line beside upstream's. The
fonts are mixed: OFL 1.1 for BML-PH Sans and the Noto/Huninn sources, Apache-2.0 for the Kosugi base of
RoundGothic — [`NOTICE.md`](../NOTICE.md) maps each file, and [`fonts/NOTICE.txt`](../fonts/NOTICE.txt)
carries the third-party notices.
