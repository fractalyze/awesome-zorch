// Tiny shared design tokens as class strings — one place to keep the
// button/label language consistent across pages.

import { formatStars } from "@/lib/github";
import { playgroundUrl } from "@/lib/site";
import { CopyButton } from "@/components/copy-button";

export const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-1.5 text-sm font-medium text-black transition-colors hover:bg-accent-soft";

export const btnGhost =
  "inline-flex items-center gap-1.5 rounded-md border border-edge px-3.5 py-1.5 text-sm text-mute transition-colors hover:border-edge-strong hover:text-ink";

/** Uppercase mono section label — the site's structural voice. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-mute">
      {children}
    </p>
  );
}

/** GitHub's star (octicon star-fill), in GitHub's star yellow by default. */
export function StarIcon({ className = "size-4 text-[#e3b341]" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={`${className} fill-current`}>
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}

/** Star-count pill. Renders nothing while a repo is private (stars null) or at 0. */
export function StarPill({ stars, className }: { stars: number | null; className?: string }) {
  if (stars == null || stars <= 0) return null;
  return (
    <span
      className={`${className ? `${className} ` : ""}inline-flex items-center gap-1 self-center rounded-full border border-edge bg-edge/40 px-2 py-0.5 font-mono text-xs text-ink`}
    >
      <StarIcon className="size-3 text-[#e3b341]" />
      {formatStars(stars)}
    </span>
  );
}

/** The pip-install copy button — the one place the command string is assembled. */
export function PipInstall({ pypi }: { pypi: string }) {
  return <CopyButton text={`pip install ${pypi}`} />;
}

/** Run-in-playground link — owns the playgroundUrl + new-tab contract for both
 *  the card footer (small) and the detail header (primary) variants. */
export function RunLink({
  lib,
  variant,
}: {
  lib: { id: string; quickstart?: string };
  variant: "card-small" | "detail-primary";
}) {
  return (
    <a
      href={playgroundUrl(lib)}
      target="_blank"
      rel="noopener"
      className={
        variant === "detail-primary"
          ? btnPrimary
          : "inline-flex shrink-0 items-center whitespace-nowrap rounded-md bg-accent px-3 py-1 text-[13px] font-medium text-black transition-colors hover:bg-accent-soft"
      }
    >
      {variant === "detail-primary" ? "Run in Playground ↗" : "Run ↗"}
    </a>
  );
}
