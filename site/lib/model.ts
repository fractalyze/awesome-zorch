// Pure types + formatting shared by server and client components.
// Keep this file free of node: imports — lib/data.ts holds the loaders.

// Array order IS the catalog display/sort order; schema/library.schema.json holds the matching data-side enum.
export const LIBRARY_TYPES = ["core", "zkvm", "snark", "accumulation", "pcs"] as const;
export type LibraryType = (typeof LIBRARY_TYPES)[number];

export interface Library {
  id: string;
  name: string;
  type: LibraryType;
  tagline: string;
  repo: string;
  upstream?: { name: string; repo: string };
  pypi?: string;
  schemes?: string[];
  quickstart?: string;
  field?: string;
  hash?: string;
  arithmetization?: string;
  pcs?: string[];
  papers?: string[];
  license?: string;
}

// The composition vocabulary: every axis a library can be described along.
// This is the ONLY place the axes are enumerated — cards (chips), catalog
// facets, and the detail-page composition panel all project from it, so a
// new axis (e.g. "argument", per design.md) is added here + Library above.
export interface CompositionAxis {
  key: string;
  /** Row label on the detail page's composition panel. */
  label: string;
  /** Facet-group heading in the catalog; axes sharing one merge into a group. */
  facetLabel: string;
  /** Hierarchy level: protocols ≠ building blocks ≠ attributes. */
  level: "scheme" | "primitive" | "attribute";
  pick: (lib: Library) => string[];
}

// Array order IS the canonical axis order: schemes lead ("what does this
// implement" is the strongest tag), then primitives, then attributes.
export const COMPOSITION_AXES: readonly CompositionAxis[] = [
  {
    key: "schemes",
    label: "Schemes",
    facetLabel: "scheme",
    level: "scheme",
    pick: (lib) => lib.schemes ?? [],
  },
  {
    key: "pcs",
    label: "PCS",
    facetLabel: "primitive",
    level: "primitive",
    pick: (lib) => lib.pcs ?? [],
  },
  {
    key: "hash",
    label: "Hash",
    facetLabel: "primitive",
    level: "primitive",
    pick: (lib) => (lib.hash ? [lib.hash] : []),
  },
  {
    key: "field",
    label: "Field",
    facetLabel: "field",
    level: "attribute",
    pick: (lib) => (lib.field ? [lib.field] : []),
  },
  {
    key: "arithmetization",
    label: "Arithmetization",
    facetLabel: "arith",
    level: "attribute",
    pick: (lib) => (lib.arithmetization ? [lib.arithmetization] : []),
  },
];

/** Flat, deduped tag list in canonical axis order — card chips + catalog search. */
export function chips(lib: Library): string[] {
  return [...new Set(COMPOSITION_AXES.flatMap((axis) => axis.pick(lib)))];
}

export interface Stat {
  label: string;
  value?: number;
  unit?: string;
  text?: string; // non-numeric milestone stat, e.g. "First working GPU implementation"
  baseline?: string;
  device?: string;
  note?: string;
  featured?: boolean;
}

export function formatStat(s: Stat): string {
  return s.text ?? `${s.value}${s.unit}`;
}
