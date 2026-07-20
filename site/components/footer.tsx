import Link from "next/link";
import { SITE } from "@/lib/site";

// Figma footer grammar, two parts: the prism CTA band (the one place color
// exists — wordmark + a serif closing line, both existing site copy), then a
// plain light strip with the links. No new copy: the closing line is the
// site description's claim sentence.
export function Footer() {
  return (
    <footer>
      <div
        className="relative overflow-hidden bg-black bg-cover bg-center py-24 text-center lg:py-32"
        style={{ backgroundImage: "url(/footer-prism.jpg)" }}
      >
        <div aria-hidden className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
          <p className="font-mono text-sm text-white">
            {SITE.name}<span className="text-white/60">_</span>
          </p>
          <p className="mt-6 font-serif text-2xl leading-snug text-white lg:text-4xl">
            ZK provers you can actually read, at GPU speed, byte-identical to
            upstream.
          </p>
        </div>
      </div>
      <div className="border-t border-edge bg-bg py-7 text-[13px] text-mute">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 sm:px-6">
          <span className="font-mono text-ink">
            {SITE.name}<span className="text-mute">_</span>
          </span>
          <Link href="/#libraries" className="transition-colors hover:text-ink">Libraries</Link>
          <Link href="/#contribute" className="transition-colors hover:text-ink">Contribute</Link>
          <a href={SITE.dataRepo} className="transition-colors hover:text-ink">Data repo ↗</a>
          <span className="ml-auto font-mono text-xs">Apache-2.0</span>
        </div>
      </div>
    </footer>
  );
}
