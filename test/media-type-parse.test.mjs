// parseMediaType promised a { mediaType, error } result, but its subtype guard re-checked `type`,
// so a malformed value such as "text/" dereferenced undefined and threw instead of setting error.
import test from "node:test";
import assert from "node:assert/strict";

import { parseMediaTypeFromString } from "../dist/client/entity_parser.js";

test("a well-formed media type parses", () => {
    const result = parseMediaTypeFromString("text/html");

    assert.equal(result.error, false);
    assert.equal(result.mediaType.type, "text");
    assert.equal(result.mediaType.subtype, "html");
});

test("parameters are parsed", () => {
    const result = parseMediaTypeFromString("text/html; charset=utf-8");

    assert.equal(result.error, false);
    assert.deepEqual(result.mediaType.parameters.map((p) => [p.attribute, p.value]), [["charset", "utf-8"]]);
});

test("a missing subtype reports an error instead of throwing", () => {
    const result = parseMediaTypeFromString("text/");

    assert.equal(result.error, true);
    assert.equal(result.mediaType.subtype, "");
    assert.equal(result.mediaType.type, "text");
});

test("a value with no slash reports an error", () => {
    const result = parseMediaTypeFromString("texthtml");

    assert.equal(result.error, true);
});
