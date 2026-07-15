import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLibraries, getLibrary, getStats, formatStat } from "@/lib/data";
import { COMPOSITION_AXES } from "@/lib/model";
import { fetchReadme, fetchStars, formatStars } from "@/lib/github";
import { SITE, playgroundUrl } from "@/lib/site";
import { Markdown } from "@/components/markdown";
import { CopyButton } from "@/components/copy-button";
import { TypeBadge } from "@/components/type-badge";
import { btnPrimary, btnGhost, Eyebrow } from "@/components/ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return getLibraries().map(({ id }) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const lib = getLibrary((await params).id);
  return lib ? { title: lib.name, description: lib.tagline } : {};
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-edge pt-4">
      <h3 className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-mute">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export default async function LibraryPage({ params }: { params: Promise<{ id: string }> }) {
  const lib = getLibrary((await params).id);
  if (!lib) notFound();

  const [readme, stars] = await Promise.all([fetchReadme(lib.repo), fetchStars(lib.repo)]);
  const stats = getStats(lib.id);
  // Rows follow the canonical COMPOSITION_AXES order (schemes, pcs, hash,
  // field, arithmetization) rather than the old hand-ordered list.
  const composition: [string, string][] = COMPOSITION_AXES.map((axis) => [
    axis.label,
    axis.pick(lib).join(", "),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* header */}
      <div className="border-b border-edge pb-8">
        <div className="flex flex-wrap items-baseline gap-3">
          {/* smaller below sm: the longest mono name (accumulation-zorch) overflows 320px at 1.7rem */}
          <h1 className="font-mono text-2xl font-semibold tracking-tight sm:text-[1.7rem]">
            {lib.name}
          </h1>
          <TypeBadge type={lib.type} />
          {stars != null && stars > 0 && (
            <span className="font-mono text-sm text-mute">★ {formatStars(stars)}</span>
          )}
        </div>
        <p className="mt-3 max-w-3xl leading-relaxed text-mute">{lib.tagline}</p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a href={playgroundUrl(lib)} className={btnPrimary}>
            Run in Playground ↗
          </a>
          {lib.pypi && <CopyButton text={`pip install ${lib.pypi}`} />}
          <a href={lib.repo} className={btnGhost}>
            GitHub ↗
          </a>
        </div>
      </div>

      <div className="grid gap-12 pt-10 lg:grid-cols-[1fr_280px]">
        {/* main: quickstart (full-width — it gets clipped in the sidebar), then README */}
        <article className="min-w-0">
          {lib.quickstart && (
            <section className="mb-10">
              <Eyebrow>Quickstart</Eyebrow>
              <div className="mt-3 [&_pre]:my-0">
                <Markdown>{"```python\n" + lib.quickstart + "\n```"}</Markdown>
              </div>
            </section>
          )}
          {readme ? (
            <Markdown>{readme}</Markdown>
          ) : (
            <div className="rounded-lg border border-dashed border-edge-strong p-8 text-sm leading-relaxed text-mute">
              README will appear here once the repository is public.
            </div>
          )}
        </article>

        {/* sidebar */}
        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          {stats.length > 0 && (
            <Panel title="Performance">
              <ul className="flex flex-col gap-3.5">
                {stats.map((s) => (
                  <li key={s.label} className="text-sm leading-snug">
                    <span className="font-mono font-semibold text-accent">{formatStat(s)}</span>{" "}
                    <span>{s.label}</span>
                    {s.baseline && <div className="mt-0.5 text-xs text-mute">{s.baseline}</div>}
                    {s.device && <div className="text-xs text-mute">{s.device}</div>}
                    {s.note && <div className="text-xs text-mute">{s.note}</div>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {composition.some(([, v]) => v) && (
            <Panel title="Composition">
              <dl className="grid grid-cols-[max-content_1fr] gap-x-5 gap-y-2 text-[13px]">
                {composition
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-mute">{k}</dt>
                      <dd className="font-mono">{v}</dd>
                    </div>
                  ))}
              </dl>
            </Panel>
          )}
          {lib.upstream && (
            <Panel title="Upstream">
              <a
                href={lib.upstream.repo}
                className="text-sm text-ink underline decoration-edge-strong underline-offset-4 hover:decoration-accent"
              >
                {lib.upstream.name} ↗
              </a>
              <p className="mt-1.5 text-xs leading-relaxed text-mute">
                {lib.name} is a port of {lib.upstream.name} on the {SITE.name} stack.
              </p>
            </Panel>
          )}
          {lib.papers && lib.papers.length > 0 && (
            <Panel title="Papers">
              <ul className="flex flex-col gap-1.5 text-[13px]">
                {lib.papers.map((p) => (
                  <li key={p}>
                    <a
                      href={p}
                      className="break-all text-ink underline decoration-edge-strong underline-offset-4 hover:decoration-accent"
                    >
                      {p.replace(/^https:\/\//, "")} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {lib.license && (
            <Panel title="License">
              <p className="font-mono text-[13px]">{lib.license}</p>
            </Panel>
          )}
        </aside>
      </div>
    </div>
  );
}
