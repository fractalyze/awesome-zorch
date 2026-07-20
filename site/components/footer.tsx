import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    // Black band over the prism photograph — the one place color exists in the
    // system. A dark gradient keeps the row of links readable on top of it.
    <footer
      className="relative overflow-hidden bg-black bg-cover bg-center py-8 text-[13px] text-white/70"
      style={{ backgroundImage: "url(/footer-prism.jpg)" }}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/65 to-black/70"
      />
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 sm:px-6">
        <span className="font-mono text-white">
          {SITE.name}<span className="text-white/70">_</span>
        </span>
        <Link href="/#libraries" className="transition-colors hover:text-white">Libraries</Link>
        <Link href="/#contribute" className="transition-colors hover:text-white">Contribute</Link>
        <a href={SITE.dataRepo} className="transition-colors hover:text-white">Data repo ↗</a>
        <span className="ml-auto font-mono text-xs">Apache-2.0</span>
      </div>
    </footer>
  );
}
