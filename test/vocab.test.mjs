// The library-type vocabulary deliberately lives in two places: the JSON
// schema enforces it at validate time (data side), and lib/model.ts encodes it
// at compile time (site side, where array order is also the catalog sort
// order). Neither can import the other, so this test is the drift guard.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { LIBRARY_TYPES } from "../site/lib/model.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("LIBRARY_TYPES matches the schema's type enum", () => {
  const schema = JSON.parse(
    fs.readFileSync(path.join(REPO_ROOT, "schema", "library.schema.json"), "utf8"),
  );
  assert.deepEqual([...LIBRARY_TYPES], schema.properties.type.enum);
});
