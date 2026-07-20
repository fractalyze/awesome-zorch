import type { LibraryType } from "@/lib/model";

// One monochrome style for every type — the label alone carries the meaning.
export function TypeBadge({ type }: { type: LibraryType }) {
  return (
    <span className="rounded-full border border-edge px-2 font-mono text-[11px] leading-5 text-mute">
      {type}
    </span>
  );
}
