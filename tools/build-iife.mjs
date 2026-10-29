// Build the drop-in IIFE bundle a browser host ships as one script tag.
//   node tools/build-iife.mjs [outfile]
// Default outfile: dist-iife/bml.js. The Android app and the TVTest plugin both load a bundle like
// this (window.WebBML = the engine's public API); the entry lives in iife/bml_entry.ts.
import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const outfile = process.argv[2] ?? "dist-iife/bml.js";
mkdirSync(dirname(outfile), { recursive: true });
await build({
    entryPoints: ["iife/bml_entry.ts"],
    outfile,
    bundle: true,
    format: "iife",
    target: "es2016",
    legalComments: "none",
    logLevel: "warning",
});
console.log(`iife: ${outfile}`);
