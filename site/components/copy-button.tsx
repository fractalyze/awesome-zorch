"use client";

import { useState } from "react";

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        // clipboard API exists only in secure contexts (HTTPS/localhost).
        if (!navigator.clipboard) return;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="group/copy inline-flex min-w-0 max-w-full items-center gap-2 rounded-full border border-edge bg-surface px-3 py-1.5 font-mono text-[13px] text-mute transition-colors hover:border-edge-strong hover:text-ink"
      title={text}
    >
      <span className="text-accent">$</span>
      <span className="truncate">{label ?? text}</span>
      <span className={copied ? "text-accent" : "text-mute"} aria-hidden>
        {copied ? "✓" : "⧉"}
      </span>
      <span className="sr-only">{copied ? "copied" : "copy to clipboard"}</span>
    </button>
  );
}
