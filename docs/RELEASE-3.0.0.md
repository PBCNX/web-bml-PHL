# Release 3.0.0 — remove the old font families

Status: **ready to execute** (written 2026-11-01, after 2.4.0). The work is deletion and references;
no design, no new faces, no API change.

## Why it is a major

Only because **files disappear**. The font option keys (`roundGothic`, `boldRoundGothic`,
`squareGothic`, `phLatin`, `fallback`, `lastResort`) keep their names and their
`{ source, descriptors }` shape, so a host's config does not change — a host only has to point those
keys at the new files, which it can already do.

## Preconditions

- [ ] `main` is 2.4.0 (`ca48f84`) and clean; `v2.4.0` is tagged on the public repo.
- [ ] Hosts informed (board line): BMLPLAYER, OpenDTV-MOD, TVTest, editor. BMLPLAYER and the editor
      vendor their own copies; OpenDTV-MOD builds from source.
- [ ] Optional courtesy: TVTest's public release has landed, so nothing is mid-flight.

## Delete

```
fonts/MPLUS1Code-Regular.woff2
fonts/MPLUS1Code-Bold.woff2
fonts/MPLUS1P-Regular.woff2
fonts/PHLatin-Regular.woff2
fonts/Kosugi-Regular.woff2
fonts/KosugiMaru-Regular.woff2
fonts/KosugiMaru-Bold.woff2
fonts/OFL-MPLUS1Code.txt
fonts/bold.py          (built KosugiMaru-Bold)
fonts/Dockerfile       (built the Kosugi pair)
```

Keep: all `BMLPH-*` files, `OFL-BMLPH-Sans.txt`, `LICENSE.txt`, `AUTHORS.txt`, `CONTRIBUTORS.txt`,
`fonts/package.json`, `fonts/README.md`.

## References to update

- [ ] `fonts/README.md` — delete the "Deprecated — removed in 3.0.0" section.
- [ ] `docs/HOSTING.md` — delete "The pre-2.1.0 M+ stack" section and the "after 3.0.0 the phLatin slot
      ships no default file" note (now it is simply true; the remaining text says so).
- [ ] `docs/PATCHES.md` — the font paragraph's last sentence about deprecated files.
- [ ] `README.md` — licence link already points at `OFL-BMLPH-Sans.txt`; check for stray mentions.
- [ ] `test/fonts.test.mjs` — drop the `Kosugi*`/`MPLUS1Code*` prefix filters (the BML-PH prefixes stay).
- [ ] `test/fonts-ink.test.mjs` — no change (it lists BMLPH faces only).
- [ ] `example/*` — already registers `BMLPH-Sans-Regular/-Bold` and serves RoundGothic (housekeeping of
      2.4.0); check the server routes still resolve.
- [ ] `fonts/package.json` — `files` list is `*.woff2`, `*.ttf`, `*.txt`, `README.md`; no change needed.

## Version and changelog

- [ ] `package.json` and `fonts/package.json` → `3.0.0`.
- [ ] `CHANGELOG.md` — new `## 3.0.0 — the old faces are gone` entry: what was removed, the six-key
      mapping (all → `BMLPH-Sans-Regular.woff2`, bold → `BMLPH-Sans-Bold.woff2`), and that the API is
      unchanged.

## Git

```
commit on main: "3.0.0 - the old font families are gone"
tag v3.0.0 (annotated), push main + tag to the public repo
```

Refs policy after the release:

| ref | after 3.0.0 |
|---|---|
| `master` | `faf4d96` (upstream provenance) — untouched |
| `main` | 3.0.0 and onward |
| `legacy/1.1.x` | 1.1.5, frozen |
| `legacy/2.x` | **not created**; cut from `v2.4.0` only if a host needs a 2.x patch |

Never rebase or force-push `main` after a tag exists on it; 3.0.0 must be a plain commit on top of
2.4.0 so `git log main` reads as the story. `v2.4.0` is the last tree that carries the old files.

## Verify

- [ ] Fresh clone of `main`: `npm ci && npm run build && npm test` → 213 tests (182 pass, 31 skip).
- [ ] `git grep -n 'MPLUS1Code\|MPLUS1P\|Kosugi\|PHLatin' -- ':!CHANGELOG.md' ':!dist'` → only historical
      mentions in CHANGELOG (and none in code, docs, tests, examples).
- [ ] `npm pack --dry-run` in the engine: the tarball's `fonts/` list contains only `BMLPH-*` files.
- [ ] `npm pack --dry-run` in `fonts/`: the same, plus the notices.
- [ ] `node -e "require('web-bml')"`-style smoke: the package still exports `clickAt`,
      `getDiagnostics` with `audioCodecs`, and the font option type.

## Board message

One line: files removed, option keys unchanged, six-key mapping, `v2.4.0` is the last tree with the old
faces, `legacy/2.x` only on demand.
