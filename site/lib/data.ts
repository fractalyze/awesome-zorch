import fs from "node:fs";
import path from "node:path";
import { load } from "js-yaml";
import { LIBRARY_TYPES, type Library, type LibraryType, type Stat } from "@/lib/model";

export type { Library, LibraryType, Stat };
export { formatStat } from "@/lib/model";

// The data lives at the repo root (this app is in site/).
const ROOT = process.env.DATA_DIR ?? path.resolve(process.cwd(), "..");

// Catalog sort order comes from the LIBRARY_TYPES array order in lib/model.ts.
const TYPE_ORDER = Object.fromEntries(LIBRARY_TYPES.map((t, i) => [t, i])) as Record<
  LibraryType,
  number
>;

/** One folder per library: libraries/<id>/<id>.yaml, with the Run button's
 *  snippet co-located as <id>.py — code in a .py file, not
 *  indentation-sensitive YAML. */
function readLibraries(): Library[] {
  const abs = path.join(ROOT, "libraries");
  if (!fs.existsSync(abs)) return [];
  // The prebuild validator gates production builds, but `next dev` has no
  // gate: skip folders that parse to nothing instead of crashing the loader.
  return fs
    .readdirSync(abs, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const yaml = path.join(abs, d.name, `${d.name}.yaml`);
      if (!fs.existsSync(yaml)) return null;
      const lib = load(fs.readFileSync(yaml, "utf8")) as Library | null;
      if (!lib) return null;
      const snippet = path.join(abs, d.name, `${d.name}.py`);
      // exactOptionalPropertyTypes: omit the key entirely when there's no snippet.
      return fs.existsSync(snippet)
        ? { ...lib, quickstart: fs.readFileSync(snippet, "utf8") }
        : lib;
    })
    .filter((lib): lib is Library => lib != null);
}

export function getLibraries(): Library[] {
  return readLibraries().sort(
    (a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name),
  );
}

export function getLibrary(id: string): Library | undefined {
  return getLibraries().find((l) => l.id === id);
}

export function getStats(id: string): Stat[] {
  const file = path.join(ROOT, "benchmarks", `${id}.yaml`);
  if (!fs.existsSync(file)) return [];
  const doc = load(fs.readFileSync(file, "utf8")) as { stats: Stat[] };
  return doc?.stats ?? [];
}

export function featuredStat(id: string): Stat | undefined {
  const stats = getStats(id);
  return stats.find((s) => s.featured) ?? stats[0];
}

/** All featured stats across libraries, for the home Performance section. */
export function allFeaturedStats(): { library: Library; stat: Stat }[] {
  return getLibraries().flatMap((library) => {
    const stat = featuredStat(library.id);
    return stat ? [{ library, stat }] : [];
  });
}
