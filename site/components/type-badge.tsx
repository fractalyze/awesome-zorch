import type { LibraryType } from "@/lib/model";

// Muted hue-coding: tinted text only, hairline border — no filled pills.
const STYLES: Record<LibraryType, string> = {
  core: "text-lime-300/90",
  zkvm: "text-sky-300/90",
  snark: "text-amber-300/90",
  accumulation: "text-rose-300/90",
  pcs: "text-fuchsia-300/90",
};

export function TypeBadge({ type }: { type: LibraryType }) {
  return (
    <span
      className={`rounded border border-edge bg-surface px-1.5 py-px font-mono text-[11px] leading-5 ${STYLES[type]}`}
    >
      {type}
    </span>
  );
}
