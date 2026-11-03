// The BML load event and the diagnostics snapshot must report the same profile for the same
// receiver. They used to disagree: the event said "C", the snapshot said String(enum) = "13".
import test from "node:test";
import assert from "node:assert/strict";

import { Profile, profileLetter } from "../dist/client/profile.js";

test("every numeric profile maps to its BML letter", () => {
    assert.equal(profileLetter(Profile.TrProfileA), "A");
    assert.equal(profileLetter(Profile.TrProfileC), "C");
    assert.equal(profileLetter(Profile.BS), "BS");
    assert.equal(profileLetter(Profile.CS), "CS");
});

test("an unknown or missing profile is the empty string, never a number", () => {
    assert.equal(profileLetter(undefined), "");
    assert.equal(profileLetter(null), "");
    assert.notEqual(profileLetter(Profile.TrProfileC), String(Profile.TrProfileC), "the snapshot must not report the raw enum");
});
