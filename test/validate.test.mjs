import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validate } from "../scripts/lib/validate.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Build a fixture root with the real schemas plus the given YAML files. */
const fixtures = [];
function makeFixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "validate-fixture-"));
  fixtures.push(dir);
  fs.cpSync(path.join(REPO_ROOT, "schema"), path.join(dir, "schema"), { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }
  return dir;
}

after(() => {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true });
});

const LIB_ALPHA = `id: alpha
name: Alpha
type: core
tagline: A minimal valid library.
repo: https://example.com/alpha
`;

test("the actual repo root validates with zero errors", () => {
  const errors = validate(REPO_ROOT);
  assert.deepEqual(errors, []);
});

test("a minimal valid fixture validates with zero errors", () => {
  const root = makeFixture({
    "libraries/alpha/alpha.yaml": LIB_ALPHA,
    "benchmarks/alpha.yaml": `library: alpha
stats:
  - label: Prove
    value: 2
    unit: x
`,
  });
  assert.equal(validate(root).length, 0);
});

test("id !== folder name is reported", () => {
  const root = makeFixture({
    "libraries/beta/beta.yaml": LIB_ALPHA, // id: alpha inside the beta folder
  });
  const errors = validate(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('id "alpha" must equal the folder name'));
  assert.ok(errors[0].includes("libraries/beta"));
});

test("a flat yaml directly under libraries/ is reported", () => {
  const root = makeFixture({
    "libraries/alpha.yaml": LIB_ALPHA, // pre-folder layout
  });
  const errors = validate(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes("lives in its own folder"));
});

test("a folder without its yaml is reported", () => {
  const root = makeFixture({
    "libraries/alpha/alpha.py": "print('snippet without a yaml')\n",
  });
  const errors = validate(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes("missing alpha.yaml"));
});

test("benchmark referencing an unknown library is reported", () => {
  const root = makeFixture({
    "libraries/alpha/alpha.yaml": LIB_ALPHA,
    "benchmarks/ghost.yaml": `library: ghost
stats:
  - label: Prove
    text: first working run
`,
  });
  const errors = validate(root);
  assert.equal(errors.length, 1);
  assert.ok(errors[0].includes('unknown library "ghost"'));
});

test("a stat with neither value/unit nor text is reported", () => {
  const root = makeFixture({
    "libraries/alpha/alpha.yaml": LIB_ALPHA,
    "benchmarks/alpha.yaml": `library: alpha
stats:
  - label: Prove
`,
  });
  const errors = validate(root);
  assert.ok(errors.length >= 1);
  assert.ok(errors.some((e) => e.includes("benchmarks/alpha") && e.includes("oneOf")));
});

test("a vocabulary violation (field: notafield) is reported", () => {
  const root = makeFixture({
    "libraries/alpha/alpha.yaml": LIB_ALPHA + "field: notafield\n",
  });
  const errors = validate(root);
  assert.ok(errors.length >= 1);
  assert.ok(errors.some((e) => e.includes("/field") && e.includes("must be equal to one of the allowed values")));
});

test("YAML parse errors are reported without throwing", () => {
  const root = makeFixture({
    "libraries/alpha/alpha.yaml": "id: [unclosed\n  bad: : yaml",
  });
  const errors = validate(root);
  assert.ok(errors.length >= 1);
  assert.ok(errors.some((e) => e.includes("YAML parse error")));
});
