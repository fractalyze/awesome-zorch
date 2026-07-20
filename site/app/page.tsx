import { getLibraries, featuredStat } from "@/lib/data";
import { fetchStars } from "@/lib/github";
import { SITE, HERO_SNIPPET } from "@/lib/site";
import { CodeWindow } from "@/components/code-window";
import { HeroPlayground } from "@/components/hero-playground";
import { Catalog } from "@/components/catalog";
import { Eyebrow, PipInstall, StarIcon, btnGhost, btnPrimary } from "@/components/ui";

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
          <h1 className="mx-auto max-w-2xl text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.02em]">
            Take your ZK research to production, <span className="text-accent">fast</span>.
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
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">
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
      <section id="contribute" className={`scroll-mt-20 border-t border-edge text-center ${sectionPad}`}>
        <div className={container}>
        <div className="flex justify-center"><Eyebrow>Contribute</Eyebrow></div>
        <h2 className="mx-auto mt-3 max-w-2xl text-[1.9rem] font-semibold leading-tight tracking-[-0.015em]">
          The cryptography community building the <span className="text-ink">future</span>.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-mute">
          The platform where the ZK community collaborates on schemes,
          implementations, and benchmarks.
        </p>
        <p className="mx-auto mt-1.5 max-w-xl text-[14px] text-mute">
          Register your library with one YAML file, reviewed by PR.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a href={`${SITE.dataRepo}/blob/main/CONTRIBUTING.md`} className={btnPrimary}>
            Contribution guide ↗
          </a>
          <a href={SITE.coreRepo} className={btnGhost}>
            <StarIcon className="size-4" /> Star on GitHub
          </a>
        </div>
        </div>
      </section>
    </div>
  );
}
