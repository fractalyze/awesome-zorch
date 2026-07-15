import { getLibraries, featuredStat } from "@/lib/data";
import { fetchStars } from "@/lib/github";
import { SITE, HERO_SNIPPET } from "@/lib/site";
import { CodeWindow } from "@/components/code-window";
import { CopyButton } from "@/components/copy-button";
import { Catalog } from "@/components/catalog";
import { Eyebrow, btnPrimary, btnGhost } from "@/components/ui";

export default async function Home() {
  const libraries = getLibraries();
  const stars = await Promise.all(libraries.map((l) => fetchStars(l.repo)));
  const core = libraries.find((l) => l.type === "core");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* ① Hero — the zorch framework itself.
          Copy from the v1 wireframe spec (home.md, "Zorch-forward" hero) +
          the zorch repo's own description — no invented claims. */}
      <section className="grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-14">
        <div>
          <h1 className="max-w-xl text-[2.6rem] font-semibold leading-[1.08] tracking-[-0.02em]">
            Take your ZK research to production, <span className="text-accent">fast</span>.
          </h1>
          <p className="mt-4 max-w-lg text-[17px] leading-relaxed text-mute">
            {SITE.name} turns research ideas into production implementations:
            JAX-native building blocks for Modern SNARKs (IOP + PCS).
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href={SITE.playground} className={btnPrimary}>
              Try in Playground ↗
            </a>
            {core?.pypi && <CopyButton text={`pip install ${core.pypi}`} />}
          </div>
        </div>
        <div className="min-w-0">
          <CodeWindow title="brakedown.py" code={HERO_SNIPPET} />
        </div>
      </section>

      {/* ② Libraries — stats live on the cards; a separate Performance section
          earns its place only when stats outgrow them (design.md §5) */}
      <section id="libraries" className="scroll-mt-20 border-t border-edge pt-10 pb-14">
        <Eyebrow>Libraries</Eyebrow>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          Everything that runs on {SITE.name}
        </h2>
        <div className="mt-7">
          <Catalog
            items={libraries.map((lib, i) => ({ lib, stat: featuredStat(lib.id), stars: stars[i] }))}
          />
        </div>
        <p className="mt-5 text-xs leading-relaxed text-mute">
          Performance numbers are measured by maintainers on pinned hardware against
          upstream, never self-reported.
        </p>
      </section>

      {/* ③ Contribute (in-page, no subpage). Kept short: details live in the
          repo's CONTRIBUTING.md. */}
      <section id="contribute" className="scroll-mt-20 border-t border-edge py-16 text-center">
        <Eyebrow>Contribute</Eyebrow>
        <h2 className="mx-auto mt-3 max-w-2xl text-[1.9rem] font-semibold leading-tight tracking-[-0.015em]">
          The cryptography community building the <span className="text-accent">future</span>.
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
            ★ Star on GitHub
          </a>
        </div>
      </section>
    </div>
  );
}
