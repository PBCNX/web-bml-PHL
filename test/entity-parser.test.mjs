// web-bml/entity-parser is a published entry point and had no test. This drives the parser the
// demuxer uses for every module: entity headers, then the body.
import test from "node:test";
import assert from "node:assert/strict";

import { EntityParser, entityHeaderToString, parseMediaTypeFromString } from "../dist/client/entity_parser.js";

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8");

function parse(input) {
    return new EntityParser(encoder.encode(input)).readEntity();
}

test("an entity splits its headers from its body", () => {
    const entity = parse("Content-Type: text/plain\r\nContent-Length: 5\r\n\r\nhello");

    assert.notEqual(entity, null);
    assert.deepEqual(entity.headers.map((h) => h.name), ["content-type", "content-length"]);
    assert.equal(entityHeaderToString(entity.headers[0]), "text/plain");
    assert.equal(decoder.decode(entity.body), "hello");
});

test("a header-less entity is all body", () => {
    // readEntity requires the blank line that ends the header block
    const entity = parse("\r\nbody only");

    assert.notEqual(entity, null);
    assert.deepEqual(entity.headers, []);
    assert.equal(decoder.decode(entity.body), "body only");
});

test("a truncated entity reports null rather than throwing", () => {
    // no CRLF terminating the header block
    const entity = new EntityParser(encoder.encode("Content-Type: text/plain")).readEntity();

    assert.equal(entity, null);
});

test("a quoted header value keeps its text", () => {
    const entity = parse('Content-Type: text/plain; charset="utf-8"\r\n\r\nx');

    // the stringifier joins the token values, so a quoted value comes back without its quotes
    assert.equal(entityHeaderToString(entity.headers[0]), "text/plain; charset=utf-8");
    const media = parseMediaTypeFromString(entityHeaderToString(entity.headers[0]));
    assert.equal(media.error, false);
    assert.equal(media.mediaType.type, "text");
    assert.equal(media.mediaType.subtype, "plain");
    assert.deepEqual(media.mediaType.parameters.map((p) => [p.attribute, p.value]), [["charset", "utf-8"]]);
});
