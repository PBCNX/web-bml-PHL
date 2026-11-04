// Installs the release gate as a git pre-push hook, so it is a hard stop rather than a command someone
// remembers to run. The hook file lives in tools/pre-push (tracked), the installed copy in .git/hooks
// (not tracked, per clone).
//
//   npm run hooks
//
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// fileURLToPath, not .pathname: the latter is percent-encoded, so a clone under a path with a space
// installed the hook with a broken path and every push failed.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "tools", "pre-push");
const hooksDir = join(root, ".git", "hooks");
const target = join(hooksDir, "pre-push");

if (!existsSync(source)) {
    console.error(`tools/pre-push is missing (${source})`);
    process.exit(1);
}
mkdirSync(hooksDir, { recursive: true });
if (existsSync(target)) {
    let existing = "";
    try {
        existing = readFileSync(target, "utf8");
    } catch {
        // unreadable: treat as foreign
    }
    if (!existing.includes("tools/publish-check.mjs") && !existing.includes("tools/pre-push")) {
        renameSync(target, target + ".bak");
        console.log(`kept the existing hook as ${target}.bak`);
    }
}
copyFileSync(source, target);
try {
    chmodSync(target, 0o755);
} catch {
    // Windows: git runs the hook through its own shell; the mode is advisory there.
}
console.log(`installed ${target}`);
