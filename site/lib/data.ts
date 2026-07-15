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

function readYamlDir<T>(dir: string): T[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  // The prebuild validator gates production builds, but `next dev` has no
  // gate: skip files that parse to nothing instead of crashing the loader.
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => load(fs.readFileSync(path.join(abs, f), "utf8")) as T)
    .filter((doc) => doc != null);
}

/** The Run button's snippet lives in snippets/<name>.py, not in the YAML —
 *  code in a .py file, not indentation-sensitive YAML. Keyed by name (unique). */
function readSnippet(name: string): string | undefined {
  const file = path.join(ROOT, "snippets", `${name}.py`);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
}

export function getLibraries(): Library[] {
  return readYamlDir<Library>("libraries")
    .map((lib) => ({ ...lib, quickstart: readSnippet(lib.name) }))
    .sort((a, b) => TYPE_ORDER[a.type] - TYPE_ORDER[b.type] || a.name.localeCompare(b.name));
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
