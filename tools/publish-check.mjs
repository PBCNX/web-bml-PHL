#!/usr/bin/env node
// The gate between the private working copy and the public repo.
//
// Run this in the private clone. It reads only tracked files, so it says exactly what would ship.
// Exit 1 means: do not push public yet.
//
//   node tools/publish-check.mjs
//
// The order it enforces is release order, not style:
//   1. commit in the private clone;
//   2. run this (tests are not run here; run `npm test` too);
//   3. only then create the public commit and tag.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");

function git(args) {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

const files = git(["ls-files"]).split("\n").filter(Boolean);

// Words that belong to the private working copy, never to a public file. Patterns are written so
// this file itself does not trip them.
const privateMarkers = [
    ["the private standards repo", /ISDBT\s*ph-Standards/i],
    ["its rule IDs", /\bBML-(CLK|FONT|SND|EWS|CAR|KEY|CHR|SCR)-\d/i],
    ["the operator's home path", /[A-Za-z]:\\Users\\/i],
    ["the workspace path", /Documents\\DeepSeek\\BML/i],
    ["the session board", new RegExp("SESSION-" + "BOARD")],
];

const failures = [];
for (const file of files) {
    if (file.startsWith("dist/")) {
        continue;
    }
    let text;
    try {
        text = readFileSync(new URL(file, "file://" + root + "/"), "utf8");
    } catch {
        continue; // binary
    }
    for (const [label, pattern] of privateMarkers) {
        const match = text.match(pattern);
        if (match) {
            const line = text.slice(0, match.index).split("\n").length;
            failures.push(`${file}:${line} carries ${label} (${match[0]})`);
        }
    }
}

// The version must agree with the newest tag when one is being cut.
let version = "?";
try {
    version = JSON.parse(readFileSync(new URL("package.json", "file://" + root + "/"), "utf8")).version;
} catch { /* reported below */ }

const check = [];
check.push({ name: "private references", ok: failures.length === 0 });
check.push({ name: "package.json version readable", ok: version !== "?" });

if (failures.length > 0) {
    console.log("private references that would ship:");
    for (const line of failures) {
        console.log("  " + line);
    }
}

for (const item of check) {
    console.log(`${item.ok ? "PASS" : "FAIL"}  ${item.name}`);
}

if (check.every((item) => item.ok)) {
    console.log(`\nversion ${version}: clean to publish (run \`npm test\` too).`);
    process.exit(0);
}
console.log("\nnot publishable: fix the FAIL lines, commit again in the private clone, then re-run.");
process.exit(1);
