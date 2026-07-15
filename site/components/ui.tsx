// Tiny shared design tokens as class strings — one place to keep the
// button/label language consistent across pages.

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
