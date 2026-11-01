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

`BMLPH-SansLite-Regular.woff2` is the same face with JIS level 1 only (0.58 MB instead of 1.09 MB) for
hosts with a tight budget; the family name is `BML-PH Sans Lite` and it registers the same way.
`BMLPH-Sans-{latin-ph,kana,cjk,symbols}.woff2` are unicode-range chunks of the full face for lazy
loading (register one `@font-face` per chunk with the matching `unicodeRange`).

The `.ttf` files are for Windows install (Settings > Fonts lists both families).

**2.3.0 adds the alternative look:** `BMLPH-RoundGothic-Regular.woff2` (family `BML-PH RoundGothic`,
Kosugi-based, same cell and coverage). Point the same keys at it when a host wants the classic maru
face; nothing else changes. There is no bold cut — CSS synthesizes it.

**3.0.0 removes the old faces.** `MPLUS1Code*`, `MPLUS1P`, `PHLatin` and `Kosugi*` go; the option keys
stay exactly as they are. After 3.0.0 the `phLatin` slot ships no default file — register `BML-PH Sans`
there too, or drop the slot and let `fallback` cover it.

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
### Pointer input (2.4.0)

A host with a mouse or a touch pointer should call `clickAt(x, y)` rather than dispatching DOM clicks
or reaching into the navigation helpers:

```js
browser.clickAt(pageX, pageY);   // page CSS pixels; false when nothing focusable is under the point
```

It hit-tests, focuses the element under the point and queues the same synchronous `click` the Enter key
does, so `onfocus` precedes `onclick` exactly as it does from the remote. A `false` return means the
page did not take the click (empty area, hidden element) — fall back to the host's own chrome instead
of pretending otherwise.
### The pre-2.1.0 M+ stack

The old registration still works and its files still ship (deprecated, removed in 3.0.0):

```js
new BMLBrowser({
  fonts: {
    roundGothic:     { source: "url(/fonts/MPLUS1Code-Regular.woff2)" },
    boldRoundGothic: { source: "url(/fonts/MPLUS1Code-Bold.woff2)" },
    squareGothic:    { source: "url(/fonts/MPLUS1Code-Regular.woff2)" },
    fallback:        { source: "url(/fonts/MPLUS1P-Regular.woff2)" },
    lastResort:      { source: "url(/fonts/KosugiMaru-Regular.woff2)" },
  },
});
```

If you keep the M+ faces, **give the three BML faces a `unicodeRange` that leaves U+3000 out** —
MPLUS1Code draws U+3000 at 0.5 em while MPLUS1P and Kosugi draw it at 1 em, so a page that pads with
it (TBS's `createPage()`) lands its coloured text on top of the base text. Route it to the fallback:

```js
const mPlus = (file) => ({ source: `url(/fonts/${file})`, descriptors: { unicodeRange: "U+0-2FFF, U+3001-10FFFF" } });
```

A host that registers nothing renders in the browser's monospace — still correct, just not the
profile's look.## Clock

The engine reports the TOT **field verbatim** and the descriptor verbatim (diagnostic). The receiver
ignores the descriptor: the ABS-CBN TVplus adds +8 to whatever the field holds (PCNX-DTV TimeInjector,
hardware test 2026-10-06), and a sweep of eight PH muxes found the same byte meaning UTC on one mux
and local on another. So a host should follow the box, not the descriptor: set
`timeZoneOffsetMinutes: 480` for a PH receiver and display the field plus that offset. GMA's UTC field
then reads 23:24 and TV5's local field reads eight hours ahead — which is what the box shows.

Do not "correct" with the descriptor: a tool that does will disagree with the receiver the viewer is
watching.

The engine takes the offset from the stream's TOT. Pass `timeZoneOffsetMinutes: 480` only for
streams that declare none (or declare a zero from another country).

## NVRAM

`nvramAreaBytes: 4096` sizes the affiliation and broadcaster areas the way the standard does. The
remaining areas keep their table size; the default is unchanged.

## Checking a configuration

`getDiagnostics()` returns the document and phase, locks, pending resources, table reads, script
errors, and `configuration` — the host's own report. That is the first thing to read when a page
looks wrong.

## Licence

The engine is MIT. The fonts are SIL OFL 1.1 (`fonts/OFL-MPLUS1Code.txt`, `fonts/LICENSE.txt`).
