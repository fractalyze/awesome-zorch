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
