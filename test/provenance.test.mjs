// The sticks' pattern: a visible provenance marker — searchable attribution, not telemetry. It must be
// exported from the leaf contracts and carried in the diagnostics snapshot, so a host's report says
// where the engine came from without a build string.
import test from "node:test";
import assert from "node:assert/strict";

import { PROVENANCE, PROJECT_AUTHOR } from "../dist/client/contracts.js";

test("the provenance marker is exported and stable", () => {
    assert.equal(PROVENANCE, "web-bml-phl-pbcnx");
    assert.match(PROVENANCE, /^[a-z0-9-]+$/, "a searchable token: lowercase, digits and dashes only");
    assert.equal(PROJECT_AUTHOR, "The web-bml-PHL Authors (PBCNX)");
});
