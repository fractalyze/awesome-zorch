import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import yaml from "js-yaml";

const ROOT = path.resolve(process.argv[2] || ".");
const errors = [];
const fail = (m) => errors.push(m);

const ajv = new Ajv({ allErrors: true, strict: false });
const vEntry = ajv.compile(JSON.parse(fs.readFileSync(path.join(ROOT, "schema/entry.schema.json"), "utf8")));
const vProfile = ajv.compile(JSON.parse(fs.readFileSync(path.join(ROOT, "schema/profile.schema.json"), "utf8")));

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p, ext) : p.endsWith(ext) ? [p] : [];
  });
}
const loadYaml = (p) => yaml.load(fs.readFileSync(p, "utf8"));

const dataDir = path.join(ROOT, "data");
const entries = {};
for (const file of walk(dataDir, ".yaml")) {
  const relId = path.relative(dataDir, file).replace(/\.yaml$/, "");
  let e;
  try { e = loadYaml(file); } catch (err) { fail(`${file}: YAML parse error — ${err.message}`); continue; }
  if (!vEntry(e)) vEntry.errors.forEach((er) => fail(`${relId}: ${er.instancePath || "/"} ${er.message}`));
  if (e && e.id !== relId) fail(`${relId}: id "${e && e.id}" must equal its path`);
  if (e && e.id && entries[e.id]) fail(`duplicate id ${e.id}`);
  if (e && e.id) entries[e.id] = e;
}

const REF_KEYS = ["field", "hash", "pcs", "arithmetization", "folding", "decider"];
for (const [id, e] of Object.entries(entries)) {
  const check = (ref, where) => { if (ref && !entries[ref]) fail(`${id}: ${where} → unknown entry "${ref}"`); };
  REF_KEYS.forEach((k) => check(e[k], k));
  (e.arguments || []).forEach((a) => check(a, "arguments[]"));
}

const boards = new Set((loadYaml(path.join(ROOT, "benchmarks/boards.yaml")) || []).map((b) => b.id));
const profiles = {};
for (const file of walk(path.join(ROOT, "benchmarks/profiles"), ".yaml")) {
  const p = loadYaml(file);
  if (!vProfile(p)) vProfile.errors.forEach((er) => fail(`${path.basename(file)}: ${er.instancePath} ${er.message}`));
  if (p) { profiles[p.id] = p; if (!boards.has(p.board)) fail(`${p.id}: unknown board "${p.board}"`); }
}
for (const file of walk(path.join(ROOT, "benchmarks/results"), ".json")) {
  for (const r of JSON.parse(fs.readFileSync(file, "utf8"))) {
    if (!profiles[r.profile]) fail(`${path.basename(file)}: unknown profile "${r.profile}"`);
    if (!entries[r.subject]) fail(`${path.basename(file)}: unknown subject "${r.subject}"`);
  }
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n` + errors.map((e) => "  - " + e).join("\n"));
  process.exit(1);
}
console.log(`✓ ${Object.keys(entries).length} entries, ${Object.keys(profiles).length} profiles — valid; all references resolve.`);
