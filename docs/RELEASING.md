# Releasing: private first, public second

There are two copies of this engine:

| copy | what it is |
|---|---|
| the **working clone** | private; the work happens here, with captures, notes and coordination files beside it |
| the **public repository** (`PBCNX/web-bml-PHL`) | what the world installs; carries no private notes, no captures, no machine paths |

They are not pushed together. The order is the safety:

```
1. commit in the working clone
2. npm run build && npm test
3. npm run check                       <- the gate
4. build the public-mirror snapshot from the same tree
5. commit the release on public main, tag it, verify from a fresh clone
```

## The gate

`tools/publish-check.mjs` reads only **tracked** files, so it reports exactly what would ship. Install it
as a git hook once per clone (`npm run hooks`): the hook runs on every push, and a push that carries a
`vX.Y.Z` tag is checked against that tag. `npm run check` is the same check by hand.

It fails on:

- the working standards repository's name or its rule IDs;
- an absolute home path or a workspace path;
- an internal board reference, in a filename form or in prose;
- a working-repository name carrying the private suffix;
- a `package.json` version it cannot read, a version that disagrees with the lockfile, the newest
  CHANGELOG section or the README, a tag that does not match it, a workspace manifest that does not
  parse, or a missing organised file (README, LICENSE.md, NOTICE.md, CHANGELOG, the font notices, the
  docs).

The marker list inside it is assembled from character codes: the file is public, and a checker that
spells out the names it exists to block is itself the leak.

It does not run the tests: run `npm test` yourself in the same step.

**A FAIL is exit code 1.** A shell chain written with `;` or newlines keeps going and will publish
anyway — the first run of this gate did exactly that, and the public commit had to be rewritten. Use
`&&`, or check the exit status explicitly, between the check and the push.

## Building the public release

The public history is real: `main` begins at upstream `master` (`faf4d96`) and every release is a commit
on that line, so a compare against upstream, a blame and a release tag all point into one graph. The
reviewed snapshot is still an orphan branch (`public-mirror`) in the working clone — same tree, reviewed
before it ships — but the pushed commit sits on top of the current public `main`:

```sh
# working clone; the release tree is committed on private main, build/test/check are green
git checkout --orphan public-mirror        # review snapshot; its tree must equal private main
git add -A
git commit -m "web-bml-PHL <version>"
npm run check                              # the artifact, not just the working tree
git push -f origin public-mirror           # private first, for review

# the release commit on the real public line
tree=$(git rev-parse 'HEAD^{tree}')
parent=$(git ls-remote https://github.com/PBCNX/web-bml-PHL.git refs/heads/main | cut -f1)
commit=$(git commit-tree "$tree" -p "$parent" -m "web-bml-PHL <version>")
git push https://github.com/PBCNX/web-bml-PHL.git "$commit:refs/heads/main"
git tag -a "v<version>" "$commit" -m "web-bml-PHL <version>"
git push https://github.com/PBCNX/web-bml-PHL.git "refs/tags/v<version>"
```

Then verify from a fresh clone of the public repository before announcing: `npm ci && npm run build &&
npm test`, and the same `npm run check` on that clone.

## Rules that came from a mistake

- **Never push public from an uncommitted tree** — the check reads commits, not your editor.
- **Never tag before the check.** A tag on a leaking tree is the most expensive thing to undo.
- **Never move a published tag.** If a release was cut wrong, label it superseded and ship a new
  version; a tag is the one thing a host pins to be reproducible.
- **A docs-only change still goes through the gate.** The one leak that reached this repo was a
  "cross-reference" section in `docs/PATCHES.md` — prose, not code.
- **Citation form:** rules are cited by document and section (NTC MC 07-12-2014, ARIB STD-B24, TR-B14,
  ABNT NBR 15608-x). A private working document is never named.

## The 3.0.0 record

3.0.0 is a major only because **files disappear**. The six font option keys (`roundGothic`,
`boldRoundGothic`, `squareGothic`, `phLatin`, `fallback`, `lastResort`) keep their names and their
`{ source, descriptors }` shape, and after this release all of them point at `BMLPH-Sans-Regular.woff2`
(and `-Bold` for bold) — which the 2026-11-02 uniform-Sans decision already made the default.

Removed:

- `MPLUS1Code-Regular/Bold`, `MPLUS1P-Regular`, `PHLatin-Regular`, `Kosugi-Regular`,
  `KosugiMaru-Regular/Bold`, `OFL-MPLUS1Code.txt`;
- the build scripts that made them (`fonts/bold.py`, `fonts/Dockerfile`).

`v2.6.2` is the last release that carries those files. The public `v2.6.3` tag was cut from a commit
that failed to apply, so it points at a tree identical to 2.6.2 with `package.json` still at 2.6.2 —
`npm install …#v2.6.3` installs 2.6.2. It is labelled superseded in the CHANGELOG and left where it is;
the text the 2.6.3 section describes ships here.

What 3.0.0 also carries, because the 2.6.x line never shipped it:

- the QC audit fixes (export map, capability key, diagnostics clock, `aiff` seam, single BIT forward,
  stranded docblock, named XML error, enforced launch token, boolean lock read, empty `es_ref`, `isHT`
  precedence, EWBS area fallback, NVRAM narrowing, 256-entry CLUT fallback);
- the **EWBS end semantics**: a `start_end_flag` 0 packet is inert (a test never stands down a live
  alert), and the only clearing signal is `stopped`, emitted when the descriptor leaves the PMT;
- the **provenance marker** (`web-bml-phl-pbcnx`, attribution, not telemetry);
- the root documentation: `LICENSE.md`, `NOTICE.md`, this page, and the rewritten `README.md`;
- **dependency hygiene**: the pinned `reworkcss/css` fork is vendored at `vendor/css` and listed in the
  package `files`, because npm 12 refuses remote-tarball dependencies by default (a clean `npm ci` failed
  on the GitHub-release URL). On npm 12 a git install also needs `--allow-git=all`; the README says so.

Verify at the tag: `232` tests, `201` passing, `31` skipped without captures.
