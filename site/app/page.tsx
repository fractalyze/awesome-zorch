import { getLibraries, featuredStat } from "@/lib/data";
import { fetchStars } from "@/lib/github";
import { SITE, HERO_SNIPPET } from "@/lib/site";
import { CodeWindow } from "@/components/code-window";
import { HeroPlayground } from "@/components/hero-playground";
import { Catalog } from "@/components/catalog";
import { Eyebrow, StarIcon, PipInstall } from "@/components/ui";

export default async function Home() {
  const libraries = getLibraries();
  const core = libraries.find((l) => l.type === "core");
  // The hero IS the core; the catalog lists what runs on it.
  const ports = libraries.filter((l) => l.type !== "core");
  const stars = await Promise.all(ports.map((l) => fetchStars(l.repo)));

  // Sections span the viewport (full-width dividers between them); content
  // stays in the centered container inside each. Vertical rhythm: py-[72px] on
  // mobile (72px), 156px on desktop.
  const container = "mx-auto max-w-6xl px-4 sm:px-6";
  const sectionPad = "py-[72px] lg:py-[156px]";

  return (
    <div>
      {/* ① Hero — the zorch framework itself.
          Copy from the v1 wireframe spec (home.md, "Zorch-forward" hero) +
          the zorch repo's own description — no invented claims. */}
      {/* Two stacked bands: the words centered, then the playground full-width
          — the frame is the hero's centerpiece and gets the whole row (no
          "Try in Playground" button: the frame IS the playground). */}
      <section className={sectionPad}>
        <div className={container}>
        <div className="text-center">
          <h1 className="mx-auto max-w-4xl font-serif text-[clamp(2.5rem,6vw,5rem)] uppercase leading-[1.05] tracking-tight">
            Take your ZK research to production, fast.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-mute">
            {SITE.name} turns research ideas into production implementations:
            JAX-native building blocks for Modern SNARKs (IOP + PCS).
          </p>
          {core?.pypi && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <PipInstall pypi={core.pypi} />
            </div>
          )}
        </div>
        <div className="mt-12 min-w-0 lg:mt-16">
          {/* The core library's real runnable snippet — Run executes it in the
              frame (playground embed). Falls back to the static API-shape
              sketch until the core snippet exists. */}
          {core?.quickstart ? (
            <HeroPlayground id={core.id} snippet={core.quickstart} />
          ) : (
            <CodeWindow title="brakedown.py" code={HERO_SNIPPET} />
          )}
        </div>
        </div>
      </section>

      {/* ② Libraries — stats live on the cards; a separate Performance section
          earns its place only when stats outgrow them (design.md §5) */}
      <section id="libraries" className={`scroll-mt-20 border-t border-edge ${sectionPad}`}>
        <div className={container}>
        <Eyebrow>Libraries</Eyebrow>
        <h2 className="mt-4 font-serif text-[32px] tracking-tight lg:text-[40px]">
          Everything that runs on {SITE.name}
        </h2>
        <div className="mt-7">
          <Catalog
            items={ports.map((lib, i) => ({ lib, stat: featuredStat(lib.id), stars: stars[i] }))}
          />
        </div>
        </div>
      </section>

      {/* ③ Contribute (in-page, no subpage). Kept short: details live in the
          repo's CONTRIBUTING.md. */}
      {/* Black band — buttons invert so they read on black. */}
      <section id="contribute" className={`scroll-mt-20 bg-black text-center text-white ${sectionPad}`}>
        <div className={container}>
        <Eyebrow className="border-white/30 text-white/70">Contribute</Eyebrow>
        <h2 className="mx-auto mt-4 max-w-2xl font-serif text-[32px] leading-tight tracking-tight lg:text-[40px]">
          The cryptography community building the <span className="text-white">future</span>.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
          The platform where the ZK community collaborates on schemes,
          implementations, and benchmarks.
        </p>
        <p className="mx-auto mt-1.5 max-w-xl text-[14px] text-white/70">
          Register your library with one YAML file, reviewed by PR.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href={`${SITE.dataRepo}/blob/main/CONTRIBUTING.md`}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-black transition-colors hover:bg-white/85"
          >
            Contribution guide ↗
          </a>
          <a
            href={SITE.coreRepo}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/40 px-3.5 py-1.5 text-sm text-white transition-colors hover:border-white"
          >
            <StarIcon className="size-4" /> Star on GitHub
          </a>
        </div>
        </div>
      </section>
    </div>
  );
}
