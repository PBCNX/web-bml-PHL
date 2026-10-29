// Engine-level real-content smoke test: what does `decodeTS` actually deliver from a capture?
//   node tools/smoke-ts.mjs <file.ts>
//
// It feeds the file packet by packet and prints the message types, the service and components, the
// modules, the TOT offset and any errors. Built for the PH verification step: a capture that gives
// `moduleListUpdated`/`moduleDownloaded` plus a `currentTime` with `localTimeOffsetMinutes: 480` is
// a stream the engine handles end to end at the transport level (the render is the host's).
import { readFileSync } from "node:fs";

import { decodeTS } from "../dist/server/decode_ts.js";

const path = process.argv[2];
const buf = readFileSync(path);
const messages = [];
const stream = decodeTS({ sendCallback: (msg) => messages.push(msg), parsePES: false });
for (let i = 0; i + 188 <= buf.length; i += 188) stream.push(buf.subarray(i, i + 188));

const byType = new Map();
for (const m of messages) byType.set(m.type, (byType.get(m.type) ?? 0) + 1);
console.log(`${path}`);
console.log(`  packets=${Math.floor(buf.length / 188)} messages=${messages.length}`);
console.log(`  by type: ${[...byType].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(" ")}`);

const program = messages.find((m) => m.type === "programInfo");
if (program) {
    console.log(`  service=${program.serviceId} network=${program.originalNetworkId} event=${program.eventName ?? "?"}`);
}
// Components are announced by the PMT; programInfo carries no component list.
const pmt = messages.filter((m) => m.type === "pmt").pop();
if (pmt) {
    const comps = (pmt.components ?? []).map((c) => `${c.componentId.toString(16).padStart(2, "0")}:pid=${c.pid}`);
    console.log(`  components=${comps.join(" ")}`);
}
// The decoder emits moduleListUpdated, not "moduleList", and its entries are {id, version, size}.
const modules = messages.filter((m) => m.type === "moduleListUpdated");
if (modules.length) {
    const last = modules[modules.length - 1];
    for (const m of last.modules ?? []) {
        console.log(`  module ${last.componentId.toString(16).padStart(2, "0")}/${m.id.toString(16).padStart(4, "0")} v${m.version} size=${m.size}`);
    }
}
const downloaded = messages.filter((m) => m.type === "moduleDownloaded");
if (downloaded.length) {
    const last = downloaded[downloaded.length - 1];
    console.log(`  downloaded=${downloaded.length} last=${last.componentId.toString(16).padStart(2, "0")}/${last.moduleId.toString(16).padStart(4, "0")} files=${last.files?.length ?? 0}`);
}
const times = messages.filter((m) => m.type === "currentTime");
if (times.length) {
    const last = times[times.length - 1];
    console.log(`  TOT utc=${new Date(last.timeUnixMillis).toISOString()} offset=${last.localTimeOffsetMinutes ?? "none"}`);
}
const bits = messages.filter((m) => m.type === "bit");
if (bits.length) console.log(`  BIT messages=${bits.length} (broadcaster table)`);
const errors = messages.filter((m) => m.type === "error");
for (const e of errors.slice(0, 3)) console.log(`  error: ${e.message}`);
