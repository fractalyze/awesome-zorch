// Guards the playground deep-link contract: playgroundUrl() must encode a
// library's quickstart into the URL fragment such that the playground recovers
// it byte-for-byte with URLSearchParams (the two ends must stay symmetric).
// Imports the real site.ts via Node's type stripping so the test tracks the
// shipped function, not a copy.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { playgroundUrl, SITE } from "../site/lib/site.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Parse the way the playground does: URLSearchParams over the URL fragment. */
function decodeFragment(url) {
  return new URLSearchParams(url.slice(url.indexOf("#") + 1));
}

test("no quickstart → bare playground (button still works)", () => {
  assert.equal(playgroundUrl(), SITE.playground);
  assert.equal(playgroundUrl({ id: "x" }), SITE.playground);
});

test("quickstart round-trips through the fragment verbatim", () => {
  // Deliberately gnarly: comments (#), a literal +, blank lines, unicode (·).
  const quickstart = "# c = a + b  · note\nimport zorch\n\nprint('x' + 'y')\n";
  const url = playgroundUrl({ id: "demo-lib", quickstart });

  assert.ok(url.startsWith(`${SITE.playground}/#`), url);
  const p = decodeFragment(url);
  assert.equal(p.get("code"), quickstart); // byte-for-byte
  assert.equal(p.get("title"), "demo-lib");
  assert.equal(p.get("run"), "1");
});

test("every shipped snippet round-trips", () => {
  const dir = path.join(REPO_ROOT, "snippets");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".py")) : [];
  for (const f of files) {
    const quickstart = fs.readFileSync(path.join(dir, f), "utf8");
    const name = f.replace(/\.py$/, "");
    const got = decodeFragment(playgroundUrl({ id: name, quickstart })).get("code");
    assert.equal(got, quickstart, `round-trip mismatch for snippets/${f}`);
  }
  assert.ok(files.length >= 1, "expected at least one snippet");
});
