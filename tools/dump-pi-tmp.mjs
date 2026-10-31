// Dump the full programInfo message (EIT p/f) from a capture, to see what times a Philippine EIT carries.

import { readFileSync } from 'node:fs';

import { decodeTS } from '../dist/server/decode_ts.js';

const buffer = readFileSync(process.argv[2]);
const messages = [];
const stream = decodeTS({sendCallback: (message) => messages.push(message), parsePES: false});
for (let offset = 0; offset + 188 <= buffer.length; offset += 188) {
    stream.push(buffer.subarray(offset, offset + 188));
}

for (const message of messages.filter((m) => m.type === 'programInfo')) {
    console.log(JSON.stringify(message, null, 2).slice(0, 900));
    break;
}
for (const message of messages.filter((m) => m.type === 'currentTime')) {
    console.log('currentTime:', JSON.stringify(message));
    break;
}
