import Link from "next/link";
import { SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="border-t border-edge bg-bg py-7 text-[13px] text-mute">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 sm:px-6">
        <span className="font-mono text-ink">
          {SITE.name}<span className="text-mute">_</span>
        </span>
        <Link href="/#libraries" className="transition-colors hover:text-ink">Libraries</Link>
        <Link href="/#contribute" className="transition-colors hover:text-ink">Contribute</Link>
        <a href={SITE.dataRepo} className="transition-colors hover:text-ink">Data repo ↗</a>
        <span className="ml-auto font-mono text-xs">Apache-2.0</span>
      </div>
    </footer>
  );
}
