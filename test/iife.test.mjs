import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import vm from "node:vm";

function buildInto(dir) {
    const outfile = join(dir, "bml.js");
    execFileSync(process.execPath, [join(import.meta.dirname, "..", "tools", "build-iife.mjs"), outfile], {
        cwd: join(import.meta.dirname, ".."),
        stdio: "pipe",
    });
    return outfile;
}

test("the IIFE build produces a drop-in bundle exposing window.WebBML", () => {
    // The Android app and the TVTest plugin both ship one script tag. Before the engine owned the
    // entry, each host kept `window.WebBML = BML` outside the repo, so the bundle could not be
    // reproduced from the engine — this is the reproducibility check.
    const dir = mkdtempSync(join(tmpdir(), "web-bml-iife-"));
    try {
        const outfile = buildInto(dir);
        const bundle = readFileSync(outfile, "utf8");
        assert.ok(statSync(outfile).size > 100_000, `bundle is suspiciously small (${statSync(outfile).size} B)`);
        assert.match(bundle, /WebBML/, "the bundle no longer assigns window.WebBML");
        assert.match(bundle, /BMLBrowser/, "the bundle does not contain the BMLBrowser export");
        assert.doesNotMatch(bundle, /^\s*import\s/m, "the bundle still has an ESM import — it is not a browser IIFE");
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});

test("the bundle actually loads and exposes the PH API, not just the strings", () => {
    // A build that compiles but throws on load would reach the host as a blank data service. The
    // bundle is evaluated in a sandbox with the globals a browser provides at script-tag time; the
    // engine must not touch the DOM until a BMLBrowser is constructed.
    const dir = mkdtempSync(join(tmpdir(), "web-bml-iife-run-"));
    try {
        const outfile = buildInto(dir);
        const sandbox = {
            console,
            setTimeout,
            clearTimeout,
            queueMicrotask,
            TextDecoder,
            TextEncoder,
            Uint8Array,
            performance: { now: () => 0 },
        };
        sandbox.window = sandbox;
        sandbox.self = sandbox;
        sandbox.globalThis = sandbox;
        vm.runInNewContext(readFileSync(outfile, "utf8"), sandbox, { filename: "bml.js" });

        const api = sandbox.WebBML;
        assert.equal(typeof api, "object");
        assert.equal(typeof api.BMLBrowser, "function", "window.WebBML.BMLBrowser is not a constructor");
        // The three PH entry points a host calls directly.
        assert.equal(typeof api.decodeARIBText, "function", "decodeARIBText missing");
        assert.equal(typeof api.areaName, "function", "areaName missing");
        assert.equal(typeof api.bmlBrowserFontNames, "object", "bmlBrowserFontNames missing");
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
});
