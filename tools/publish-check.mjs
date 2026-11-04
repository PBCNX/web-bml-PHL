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
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, not .pathname: the latter is percent-encoded, so a clone under a path with a space
// had the gate look for the escaped form and the installed hook failed every push.
const root = fileURLToPath(new URL("..", import.meta.url));

function git(args) {
    return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

const files = git(["ls-files"]).split("\n").filter(Boolean);

// Words that belong to the private working copy, never to a public file. This file is itself public, so
// the vocabulary is assembled from character codes instead of being written out: a checker that leaks
// exactly the names it exists to block is worse than no checker.
const chars = (...codes) => String.fromCharCode(...codes);
const pcc = /[A-Za-z]:\\Users\\/i; // an absolute home path, spelled by the regex itself
const privateMarkers = [
    ["the private standards repository", new RegExp(chars(73, 83, 68, 66, 84) + "\\s*" + chars(112, 104) + "-" + chars(83, 116, 97, 110, 100, 97, 114, 100, 115), "i")],
    ["a rule ID from the private notes", /\bBML-(CLK|FONT|SND|EWS|CAR|KEY|CHR|SCR)-\d/i],
    ["the operator's home path", pcc],
    ["the workspace path", new RegExp(chars(68, 111, 99, 117, 109, 101, 110, 116, 115) + "\\\\" + chars(68, 101, 101, 112, 83, 101, 101, 107) + "\\\\" + chars(66, 77, 76), "i")],
    ["an internal board reference", new RegExp(chars(83, 69, 83, 83, 73, 79, 78) + "-" + chars(66, 79, 65, 82, 68))],
    ["an internal board in prose", new RegExp(chars(115, 101, 115, 115, 105, 111, 110) + " " + chars(98, 111, 97, 114, 100) + "|" + chars(98, 111, 97, 114, 100) + " (line|message)", "i")],
    ["a private working repo name", new RegExp("-" + chars(112, 114, 118) + "\\b", "i")],
];

const failures = [];
for (const file of files) {
    if (file.startsWith("dist/")) {
        continue;
    }
    let text;
    try {
        text = readFileSync(join(root, file), "utf8");
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

// Double-encoded UTF-8 is the defect a public docs page cannot hide: Japanese text ends up as latin-1
// letters and a dash as the cp1252 punctuation run. A line is rejected when its characters map back to
// bytes that decode as UTF-8 to strictly fewer suspicious characters than the line itself has - the
// reverse of the round trip that caused it.
const cp1252 = new Map();
for (let b = 0; b < 256; b++) {
    try {
        const ch = new TextDecoder("windows-1252").decode(new Uint8Array([b]));
        if (ch.length === 1 && ch !== "\uFFFD") cp1252.set(ch, b);
    } catch {
        // an undefined cp1252 byte
    }
}
const odd = (ch) => {
    const o = ch.codePointAt(0);
    return (o >= 0x80 && o <= 0xff) || [0x201a, 0x201e, 0x2020, 0x2021, 0x2022, 0x2030, 0x2039, 0x203a,
        0x20ac, 0x2122, 0x192, 0x2c6, 0x2dc, 0xfffd].includes(o);
};
const oddCount = (line) => [...line].filter(odd).length;
for (const file of files) {
    if (file.startsWith("dist/")) continue;
    let text;
    try {
        text = readFileSync(join(root, file), "utf8");
    } catch {
        continue;
    }
    for (const [i, line] of text.split("\n").entries()) {
        if (oddCount(line) < 2) continue;
        const bytes = [];
        for (const ch of line) {
            const b = cp1252.get(ch);
            if (b == null) {
                bytes.length = 0;
                break;
            }
            bytes.push(b);
        }
        if (bytes.length !== line.length) continue;
        let cand;
        try {
            cand = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
        } catch {
            continue;
        }
        if (oddCount(cand) < oddCount(line)) {
            failures.push(`${file}:${i + 1} is double-encoded UTF-8 (${line.trim().slice(0, 40)})`);
        }
    }
}

// The version must agree with the tag being published. A release where they disagree installs under
// the wrong version — v2.6.3 shipped with package.json 2.6.2 on 2026-11-04 — so a requested tag is
// checked, and a tag sitting on HEAD is checked too.
let version = "?";
try {
    version = JSON.parse(readFileSync(new URL("package.json", "file://" + root + "/"), "utf8")).version;
} catch { /* reported below */ }

const tagArgIndex = process.argv.indexOf("--tag");
const requestedTag = tagArgIndex >= 0 ? process.argv[tagArgIndex + 1] : null;
const headTag = (() => {
    try {
        return git(["tag", "--points-at", "HEAD"]).split("\n").find((name) => /^v\d+\.\d+\.\d+$/.test(name)) ?? null;
    } catch {
        return null;
    }
})();
const tagToCheck = requestedTag ?? headTag;

// The version lives in four places, and v2.6.3 showed how easily they drift: package.json said 2.6.2,
// the changelog's newest section 2.6.2, the README 2.6.0, the lockfile 2.0.0 — and the tag said 2.6.3.
// A release commit is only consistent when all four agree, and the workspace manifests must parse at all
// (a stray comma in fonts/package.json broke `npm ci` while nothing in the test suite looked at it).
function readJson(rel) {
    try {
        return JSON.parse(readFileSync(new URL(rel, "file://" + root + "/"), "utf8"));
    } catch {
        return null;
    }
}

const lock = readJson("package-lock.json");
const readme = (() => {
    try {
        return readFileSync(new URL("README.md", "file://" + root + "/"), "utf8");
    } catch {
        return "";
    }
})();
const changelog = (() => {
    try {
        return readFileSync(new URL("CHANGELOG.md", "file://" + root + "/"), "utf8");
    } catch {
        return "";
    }
})();
const newestChangelogVersion = /^## (\d+\.\d+\.\d+)/m.exec(changelog)?.[1] ?? null;

// The repository is organised by contract: the ownership and provenance pages are part of the release,
// not optional prose. A missing one is a packaging bug, not a documentation preference.
const requiredFiles = [
    "README.md", "LICENSE.md", "NOTICE.md", "CHANGELOG.md",
    "fonts/NOTICE.txt", "fonts/OFL-BMLPH-Sans.txt", "fonts/LICENSE.txt",
    "docs/HOSTING.md", "docs/PATCHES.md", "docs/RELEASING.md",
];
const missingFiles = requiredFiles.filter((rel) => !existsSync(new URL(rel, "file://" + root + "/")));

const check = [];
check.push({ name: "private references", ok: failures.length === 0 });
check.push({
    name: missingFiles.length === 0 ? "organised files present" : `missing files: ${missingFiles.join(", ")}`,
    ok: missingFiles.length === 0,
});
check.push({ name: "package.json version readable", ok: version !== "?" });
check.push({ name: "fonts/package.json parses", ok: readJson("fonts/package.json") != null });
check.push({ name: "example/package.json parses", ok: readJson("example/package.json") != null });
check.push({
    name: `package-lock root version matches (${lock?.version ?? "unreadable"})`,
    ok: lock?.version === version,
});
check.push({
    name: `package-lock workspace version matches (${lock?.packages?.["fonts"]?.version ?? "unreadable"})`,
    ok: lock?.packages?.fonts?.version === version,
});
check.push({
    name: `CHANGELOG newest section is ${version} (${newestChangelogVersion ?? "none"})`,
    ok: newestChangelogVersion === version,
});
check.push({
    name: `README names the version (${version})`,
    ok: readme.includes(`**${version}**`) || readme.includes(`# ${version}`),
});
check.push({
    name: tagToCheck == null
        ? "no release tag to check"
        : `tag ${tagToCheck} matches package.json (${version})`,
    ok: tagToCheck == null || tagToCheck === `v${version}`,
});

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
    console.log(`\nversion ${version}${tagToCheck ? ` at ${tagToCheck}` : ""}: clean to publish (run \`npm test\` too).`);
    process.exit(0);
}
console.log("\nnot publishable: fix the FAIL lines, commit again in the private clone, then re-run.");
process.exit(1);
