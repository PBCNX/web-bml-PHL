// dist/ is committed and shipped, and `tsc` never prunes: a module that moves leaves its old
// compiled output behind, so the package ships code no source owns. That happened when the ES2
// primitives moved to client/interpreter/ and dist/client/{date,number,string}.js survived.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const root = join(import.meta.dirname, "..");

function walk(dir) {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            out.push(...walk(full));
        } else {
            out.push(full);
        }
    }
    return out;
}

test("every compiled module in dist has a source module", () => {
    const compiled = walk(join(root, "dist")).filter((f) => f.endsWith(".js") && !f.endsWith(".map"));
    const orphans = compiled.filter((file) => {
        const rel = relative(join(root, "dist"), file).replace(/\.js$/, ".ts");
        // dist mirrors the source tree, so the same relative path must exist under the repo root
        return !statExists(join(root, rel)) && !statExists(join(root, "client", rel.replace(/^client[\\/]/, ""))) && !statExists(join(root, "iife", rel)) && !statExists(join(root, "es2", rel));
    });

    assert.deepEqual(
        orphans.map((f) => relative(root, f)),
        [],
        "dist ships modules whose source no longer exists — remove them (tsc never prunes)",
    );
});

function statExists(path) {
    try {
        statSync(path);
        return true;
    } catch {
        return false;
    }
}
test("the emitted client graph has no require cycle", () => {
    // Every review has had to verify this by hand: dist/client must be acyclic at runtime, or the
    // IIFE entry resolves a half-initialised module. This is the gate.
    const files = walk(join(root, "dist", "client")).filter((f) => f.endsWith(".js") && !f.endsWith(".map"));
    const graph = new Map();
    for (const file of files) {
        const source = readFileSyncSafe(file);
        // Compiled requires are extensionless (`require("./foo")`), so the resolved path needs its
        // ".js" before it can match a file — without this every edge is dropped and the graph is
        // empty, which is a test that cannot fail.
        const deps = [...source.matchAll(/require\("(\.[^"]+)"\)/g)]
            .map((m) => resolve(join(dirname(file), m[1])))
            .map((p) => (files.includes(p) ? p : files.includes(`${p}.js`) ? `${p}.js` : null))
            .filter((p) => p != null);
        graph.set(file, deps);
    }

    const state = new Map(); // 0 = visiting, 1 = done
    const cycles = [];
    function visit(node, path) {
        if (state.get(node) === 1) {
            return;
        }
        if (state.get(node) === 0) {
            cycles.push([...path, node].map((f) => relative(root, f)));
            return;
        }
        state.set(node, 0);
        for (const dep of graph.get(node) ?? []) {
            visit(dep, [...path, node]);
        }
        state.set(node, 1);
    }
    for (const file of graph.keys()) {
        visit(file, []);
    }

    assert.deepEqual(cycles, [], "dist/client has a runtime require cycle");
});
function readFileSyncSafe(path) {
    return readFileSync(path, "utf8");
}