<h1 align="center">awesome-zorch</h1>

<p align="center">
  A community-curated catalog of zero-knowledge <b>schemes</b> and <b>implementations</b> —
  the data behind the awesome-zorch website.
</p>

---

**awesome-zorch is a data repository.** Contributors open PRs that add one metadata file per
scheme or implementation. When a PR merges to `main`, CI compiles the catalog into
`dist/data.json`, and the website renders it as browsable listings and apples-to-apples
leaderboards — HuggingFace, but for ZK.

The goal: make it easy to publish a ZK implementation, compare implementations fairly, and — by
curating the primitives and how they compose — converge the community on a shared standard.

## How it works

```
 contributor PR                     main branch                    website
 (one YAML file)  ──review+CI──▶  data/**/*.yaml  ──build──▶  dist/data.json ──▶ listings + leaderboards
                                        ▲                                              ▲
                                        │ metadata only (public)                       │ renders READMEs
                                        │                                              │ from upstream repo/PyPI
                                 server-side (private): hidden test inputs, SRS/keys, benchmark runs ──┘
```

- **Public, in this repo:** all scheme/implementation *metadata*.
- **Private, server-side:** the hidden `TestInput` (ELFs, hash vectors), the canonical SRS/keys,
  and the benchmark harness. Contributors submit *implementations*, never performance numbers — this
  addresses both large-payload/DDoS risk and leaderboard gaming. See [`benchmarks/`](benchmarks/).
- **READMEs are not stored here.** An entry points at its upstream repo / PyPI package; the site
  fetches the README at render time.

## The data model

Two tiers:

- **Abstract primitives** — `Hash`, `PCS`, `Argument`, `Folding`, `Primitive` — are field-agnostic and
  reusable. They declare *dependency slots by category* (e.g. `PCS "WHIR" needs [Hash]`).
- **Concrete implementations** — `Implementation{ kind: Zkvm | Snark | Accumulation }` — bind
  everything (field, hash, params) by filling those slots, and are what the leaderboard benchmarks.

`Field` and `Arithmetization` are attributes an implementation carries, not browsable categories.
Full reference: **[`schema.md`](schema.md)** (human) and **[`schema/`](schema/)** (machine JSON Schema).

## Repository layout

```
data/               the catalog — one YAML per entry, id == path (data/pcs/whir.yaml → id: pcs/whir)
  hash/ pcs/ arg/ fold/ prim/ impl/ field/ arith/
schema/             entry.schema.json + profile.schema.json (validation)
schema.md           human-readable data model
benchmarks/         boards.yaml · profiles/*.yaml · results/*.json (maintainer-published) · policy
scripts/            validate.mjs (schema + reference integrity) · build.mjs (→ dist/data.json)
wireframe/          design-reference mock of the site (open wireframe/index.html)
.github/            PR template · issue forms · validate CI
home.md · design.md wireframe design docs
```

## Quick start

```bash
npm install
npm run validate      # schema check + reference integrity on every entry
npm run build         # compile data/ + benchmarks/ → dist/data.json + wireframe/data.js

# preview the site mock (run `npm run build` first — it generates wireframe/data.js):
cd wireframe && python3 -m http.server 8000   # http://localhost:8000
```

## Contributing

Add an entry by opening a PR with one file under `data/<category>/<slug>.yaml`. See
**[CONTRIBUTING.md](CONTRIBUTING.md)** for the full walkthrough, or file an issue via the
["Add an implementation" / "Add a scheme"](.github/ISSUE_TEMPLATE) forms and a maintainer will help.

## License

[Apache-2.0](LICENSE).
