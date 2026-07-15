import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import { load } from "js-yaml";

/**
 * Validate the catalog data under `rootDir` (libraries/, benchmarks/,
 * schema/). Pure with respect to output: reads the filesystem, returns an
 * array of error strings (empty = valid), never prints or exits.
 *
 * Returns `{ errors, libraryCount }` via `validateWithStats`; `validate`
 * returns just the error array.
 */
export function validateWithStats(rootDir) {
  const ROOT = path.resolve(rootDir);
  const errors = [];
  const fail = (m) => errors.push(m);

  const ajv = new Ajv({ allErrors: true });
  const compile = (f) => ajv.compile(JSON.parse(fs.readFileSync(path.join(ROOT, "schema", f), "utf8")));
  const vLibrary = compile("library.schema.json");
  const vBenchmark = compile("benchmark.schema.json");

  const loadYaml = (p) => load(fs.readFileSync(p, "utf8"));
  const list = (dir) =>
    fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".yaml")).map((f) => path.join(dir, f)) : [];

  const libraries = {};
  for (const file of list(path.join(ROOT, "libraries"))) {
    const slug = path.basename(file, ".yaml");
    let e;
    try { e = loadYaml(file); } catch (err) { fail(`${file}: YAML parse error — ${err.message}`); continue; }
    if (!vLibrary(e)) vLibrary.errors.forEach((er) => fail(`libraries/${slug}: ${er.instancePath || "/"} ${er.message}`));
    // id === filename (checked above) already implies id uniqueness: one dir, unique filenames.
    if (e && e.id !== slug) fail(`libraries/${slug}: id "${e && e.id}" must equal the filename`);
    if (e) libraries[slug] = e;
  }

  for (const file of list(path.join(ROOT, "benchmarks"))) {
    const slug = path.basename(file, ".yaml");
    let b;
    try { b = loadYaml(file); } catch (err) { fail(`${file}: YAML parse error — ${err.message}`); continue; }
    if (!vBenchmark(b)) vBenchmark.errors.forEach((er) => fail(`benchmarks/${slug}: ${er.instancePath || "/"} ${er.message}`));
    if (b && b.library !== slug) fail(`benchmarks/${slug}: library "${b && b.library}" must equal the filename`);
    if (b && !libraries[b.library]) fail(`benchmarks/${slug}: unknown library "${b.library}"`);
  }

  return { errors, libraryCount: Object.keys(libraries).length };
}

export function validate(rootDir) {
  return validateWithStats(rootDir).errors;
}
