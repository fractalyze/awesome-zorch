import Link from "next/link";
import type { Library, Stat } from "@/lib/model";
import { chips, formatStat } from "@/lib/model";
import { TypeBadge } from "@/components/type-badge";
import { StarPill, PipInstall, RunLink } from "@/components/ui";

export function LibraryCard({
  lib,
  stat,
  stars,
  onTagClick,
}: {
  lib: Library;
  stat?: Stat;
  stars: number | null;
  /** When set (catalog view), chips become filter buttons. */
  onTagClick?: (tag: string) => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-edge bg-surface p-5 transition-colors hover:border-edge-strong">
      <div className="flex items-baseline gap-2.5">
        {/* stretched link: the whole card navigates, action buttons sit above it */}
        <Link
          href={`/library/${lib.id}`}
          className="font-mono text-[15px] font-semibold tracking-tight after:absolute after:inset-0"
        >
          {lib.name}
        </Link>
        <TypeBadge type={lib.type} />
        <StarPill stars={stars} className="ml-auto" />
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-mute">{lib.tagline}</p>
      {stat && (
        <p className="mt-3 text-sm">
          <span className="font-mono font-semibold text-accent">{formatStat(stat)}</span>
          {stat.baseline && <span className="text-mute"> {stat.baseline}</span>}
        </p>
      )}
      <div aria-hidden className="min-h-4 grow" />
      {/* chips hug the footer so every card's tag row sits at the same height */}
      {chips(lib).length > 0 && (
        <div className="relative z-10 mb-3 flex flex-wrap gap-1.5">
          {chips(lib).map((c) =>
            onTagClick ? (
              <button
                key={c}
                type="button"
                onClick={() => onTagClick(c)}
                aria-label={`Filter libraries by ${c}`}
                title={`Filter libraries by ${c}`}
                className="rounded-full border border-edge-strong bg-edge px-2 py-0.5 font-mono text-[11px] leading-5 text-ink/85 transition-colors hover:border-ink hover:text-ink"
              >
                {c}
              </button>
            ) : (
              <span
                key={c}
                className="rounded-full bg-edge px-2 py-0.5 font-mono text-[11px] leading-5 text-ink/85"
              >
                {c}
              </span>
            )
          )}
        </div>
      )}
      {/* footer bar flush with the card's bottom edge; pip copy leads, Run
          sits right (and only exists when the library has a snippet) */}
      <div className="relative z-10 -mx-5 -mb-5 flex items-center gap-2 border-t border-edge px-5 py-3">
        {lib.pypi && (
          <span className="min-w-0">
            <PipInstall pypi={lib.pypi} />
          </span>
        )}
        <RunLink lib={lib} variant="card-small" className="ml-auto" />
      </div>
    </div>
  );
}
