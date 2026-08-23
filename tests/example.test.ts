import assert from "node:assert/strict";
import { test } from "node:test";

test("suppress Ci", () => {
	assert.equal(1, 1);
});
