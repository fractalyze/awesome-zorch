"use client";

import { useState } from "react";
import {
  COMPOSITION_AXES,
  LIBRARY_TYPES,
  chips,
  type Library,
  type LibraryType,
  type Stat,
} from "@/lib/model";
import { LibraryCard } from "@/components/library-card";

export interface CatalogItem {
  lib: Library;
  stat?: Stat;
  stars: number | null;
}

export function Catalog({ items }: { items: CatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<LibraryType | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  // Facets grouped by display group — axes sharing a facetLabel (the
  // primitive-level pcs + hash) merge into one column, in canonical axis
  // order. Derived from COMPOSITION_AXES, never hand-listed here.
  const groups = new Map<string, Set<string>>();
  for (const axis of COMPOSITION_AXES) {
    const values = groups.get(axis.facetLabel) ?? new Set<string>();
    groups.set(axis.facetLabel, values);
    for (const { lib } of items) for (const v of axis.pick(lib)) values.add(v);
  }
  const facetGroups: [string, string[]][] = [...groups]
    .map(([label, values]): [string, string[]] => [label, [...values]])
    .filter(([, vs]) => vs.length > 0);

  const q = query.trim().toLowerCase();
  const visible = items.filter(({ lib }) => {
    if (type && lib.type !== type) return false;
    if (tag && !chips(lib).includes(tag)) return false;
    if (!q) return true;
    return [lib.name, lib.tagline, ...chips(lib)].join(" ").toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          aria-label="Search libraries"
          className="w-full max-w-xs rounded-md border border-edge bg-surface px-3 py-1.5 font-mono text-[13px] placeholder:text-mute/70 focus:border-edge-strong focus:outline-none"
        />
        <div className="flex gap-1.5" role="group" aria-label="Filter by type">
          {LIBRARY_TYPES.map((t) => {
            const count = items.filter(({ lib }) => lib.type === t).length;
            if (count === 0) return null;
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => setType(active ? null : t)}
                className={`rounded-md border px-2.5 py-1 font-mono text-xs transition-colors ${
                  active
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-edge text-mute hover:border-edge-strong hover:text-ink"
                }`}
              >
                {t} <span className={active ? "text-accent/70" : "text-mute/60"}>{count}</span>
              </button>
            );
          })}
        </div>
        {(tag || type || query) && (
          <button
            type="button"
            onClick={() => {
              setTag(null);
              setType(null);
              setQuery("");
            }}
            className="ml-auto font-mono text-[11px] text-mute underline underline-offset-4 hover:text-ink"
          >
            clear filters
          </button>
        )}
      </div>

      {/* Facet groups, one column per level, spanning the full width — click
          to filter the repos (the v1 schemes-browse intent, applied to the
          catalog). */}
      <div className="grid gap-x-6 gap-y-4 rounded-lg border border-edge bg-surface/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {facetGroups.map(([label, values]) => (
          <div key={label} role="group" aria-label={`Filter by ${label}`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-mute/70">
              {label}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {values.map((t) => {
                const active = tag === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setTag(active ? null : t)}
                    className={`rounded border px-2 py-0.5 font-mono text-[11px] leading-5 transition-colors ${
                      active
                        ? "border-accent/60 bg-accent/10 text-accent"
                        : "border-edge bg-surface text-mute hover:border-edge-strong hover:text-ink"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visible.map((item) => (
          <LibraryCard key={item.lib.id} {...item} onTagClick={setTag} />
        ))}
      </div>
      {visible.length === 0 && (
        <p role="status" className="py-10 text-center font-mono text-sm text-mute">
          No libraries match. Try a different filter.
        </p>
      )}
    </div>
  );
}
