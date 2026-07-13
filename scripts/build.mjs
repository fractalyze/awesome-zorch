import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const ROOT = path.resolve(process.argv[2] || ".");
const OUT = path.join(ROOT, "dist");

function walk(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p, ext) : p.endsWith(ext) ? [p] : [];
  });
}
const loadYaml = (p) => yaml.load(fs.readFileSync(p, "utf8"));

const entries = {};
for (const file of walk(path.join(ROOT, "data"), ".yaml")) {
  const { id, ...rest } = loadYaml(file);
  entries[id] = rest;
}
const boards = loadYaml(path.join(ROOT, "benchmarks/boards.yaml"));
const profiles = walk(path.join(ROOT, "benchmarks/profiles"), ".yaml").map(loadYaml);
const results = walk(path.join(ROOT, "benchmarks/results"), ".json").flatMap((f) => JSON.parse(fs.readFileSync(f, "utf8")));

const payload = { entries, boards, profiles, results };

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "data.json"), JSON.stringify(payload, null, 2) + "\n");

fs.writeFileSync(
  path.join(ROOT, "wireframe", "data.js"),
  "/* Generated from data/ by scripts/build.mjs — edit data/, then `npm run build`. */\n" +
    "window.__AZ_DATA__ = " + JSON.stringify(payload, null, 2) + ";\n"
);

console.log(`✓ dist/data.json + wireframe/data.js — ${Object.keys(entries).length} entries, ${boards.length} boards, ${profiles.length} profiles, ${results.length} results.`);
