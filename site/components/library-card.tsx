import Link from "next/link";
import type { Library, Stat } from "@/lib/model";
import { chips, formatStat } from "@/lib/model";
import { formatStars } from "@/lib/github";
import { playgroundUrl } from "@/lib/site";
import { TypeBadge } from "@/components/type-badge";
import { CopyButton } from "@/components/copy-button";
import { StarIcon } from "@/components/ui";

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
    <div className="group relative flex flex-col rounded-lg border border-edge bg-surface p-5 transition-colors hover:border-edge-strong">
      <div className="flex items-baseline gap-2.5">
        {/* stretched link: the whole card navigates, action buttons sit above it */}
        <Link
          href={`/library/${lib.id}`}
          className="font-mono text-[15px] font-semibold tracking-tight after:absolute after:inset-0 group-hover:text-accent"
        >
          {lib.name}
        </Link>
        <TypeBadge type={lib.type} />
        {stars != null && stars > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 self-center rounded-full border border-edge bg-edge/40 px-2 py-0.5 font-mono text-xs text-ink">
            <StarIcon className="size-3 text-[#e3b341]" />
            {formatStars(stars)}
          </span>
        )}
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
                className="rounded border border-edge-strong bg-edge px-2 py-0.5 font-mono text-[11px] leading-5 text-ink/85 transition-colors hover:border-accent hover:text-accent"
              >
                {c}
              </button>
            ) : (
              <span
                key={c}
                className="rounded bg-edge px-2 py-0.5 font-mono text-[11px] leading-5 text-ink/85"
              >
                {c}
              </span>
            )
          )}
        </div>
      )}
      {/* footer bar flush with the card's bottom edge; pip copy sits right */}
      <div className="relative z-10 -mx-5 -mb-5 flex items-center gap-2 border-t border-edge px-5 py-3">
        <a
          href={playgroundUrl(lib)}
          target="_blank"
          rel="noopener"
          className="inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-accent px-3 py-1 text-[13px] font-medium text-black transition-colors hover:bg-accent-soft"
        >
          Run ↗
        </a>
        {lib.pypi && (
          <span className="ml-auto min-w-0">
            <CopyButton text={`pip install ${lib.pypi}`} />
          </span>
        )}
      </div>
    </div>
  );
}
