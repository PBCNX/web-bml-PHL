# Releasing: private first, public second

There are two copies of this engine:

| copy | what it is |
|---|---|
| the **working clone** (`web-bml-PHL-prv` on this machine) | private; the session does its work here, with captures, notes and coordination files beside it |
| the **public mirror** (`PBCNX/web-bml-PHL`) | what the world installs; carries no private notes, no captures, no machine paths |

They are not pushed together. The order is the safety:

```
1. commit in the working clone
2. npm run build && npm test
3. node tools/publish-check.mjs        <- the gate
4. only then: build the public commit from the same tree, tag it, push both
```

## Why the order matters

The public copy is a **filter**, not a fork. Anything a commit carries — a private note name, a rule ID
from a working document, a path under someone's home directory — ships with it. Pushing public first
and fixing afterwards means a rewrite of published history, which is the one thing a release should
never need.

`tools/publish-check.mjs` reads only **tracked** files, so it reports exactly what would ship. It fails
on:

- the working standards repo's name or its rule IDs;
- a home-directory or workspace path;
- the session board;
- a `package.json` version it cannot read.

It does not run the tests: run `npm test` yourself in the same step.

## Building the public commit

The public history is linear and its own; the working clone's commits are the record of *why*. So the
public commit is made from the working tree:

```sh
tree=$(git rev-parse 'HEAD^{tree}')
commit=$(git commit-tree "$tree" -p <previous-public-head> -m "<short release title>")
git push https://github.com/PBCNX/web-bml-PHL.git "$commit:refs/heads/main"
git tag -a "v<version>" "$commit" -m "web-bml-PHL <version>"
git push https://github.com/PBCNX/web-bml-PHL.git "refs/tags/v<version>"
```

Then verify from a fresh clone of the public repo before announcing: `npm ci && npm run build && npm test`.

## Rules that came from a mistake

- **Never push public from an uncommitted tree** — the check reads commits, not your editor.
- **Never tag before the check.** A tag on a leaking tree is the most expensive thing to undo.
- **A docs-only change still goes through the gate.** The one leak that reached this repo was a
  "cross-reference" section in `docs/PATCHES.md` — prose, not code.
- **Citation form:** rules are cited by document and section (NTC MC 07-12-2014, ARIB STD-B24,
  TR-B14, ABNT NBR 15608-x). A private working document is never named.
