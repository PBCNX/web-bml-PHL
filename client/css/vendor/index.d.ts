// The vendored `css` parser's surface, for the engine's TypeScript.
//
// The runtime module is the CommonJS package in this directory — the engine's pinned fork of
// reworkcss/css 3.0.2, which is not on the npm registry. It used to be a `file:` dependency, which
// npm 12 cannot install into a host (the link is judged dead while its target is being replaced);
// since 3.0.4 it is compiled with the engine instead of resolved from node_modules.
//
// The types come from @types/css (a devDependency, never installed by a host) so the engine's
// namespace references — css.Node, css.Stylesheet, css.Rule, css.Declaration, css.Comment — keep
// their meaning.
import css = require("css");
export = css;
