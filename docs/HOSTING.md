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

Register the faces under the names the stylesheets use:

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

The files ship in `node_modules/web-bml/fonts/`; copy the ones you register into your static path.
A host that registers nothing renders in the browser's monospace — still correct, just not the
profile's look.

## Clock

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
