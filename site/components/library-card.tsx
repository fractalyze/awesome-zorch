import Link from "next/link";
import type { Library, Stat } from "@/lib/model";
import { chips, formatStat } from "@/lib/model";
import { formatStars } from "@/lib/github";
import { playgroundUrl } from "@/lib/site";
import { TypeBadge } from "@/components/type-badge";
import { CopyButton } from "@/components/copy-button";

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
          <span className="ml-auto font-mono text-xs text-mute">★ {formatStars(stars)}</span>
        )}
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-mute">{lib.tagline}</p>
      {stat && (
        <p className="mt-3 text-sm">
          <span className="font-mono font-semibold text-accent">{formatStat(stat)}</span>
          {stat.baseline && <span className="text-mute"> {stat.baseline}</span>}
        </p>
      )}
      {chips(lib).length > 0 && (
        <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
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
      <div aria-hidden className="min-h-4 grow" />
      {/* footer bar flush with the card's bottom edge */}
      <div className="relative z-10 -mx-5 -mb-5 flex flex-wrap items-center gap-2 border-t border-edge px-5 py-3">
        <a
          href={playgroundUrl(lib)}
          className="inline-flex items-center rounded-md bg-accent px-3 py-1 text-[13px] font-medium text-black transition-colors hover:bg-accent-soft"
        >
          Run ↗
        </a>
        {lib.pypi && <CopyButton text={`pip install ${lib.pypi}`} />}
      </div>
    </div>
  );
}
