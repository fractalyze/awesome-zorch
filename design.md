# awesome-zorch — Design (v2, 2026-07-14)

Single source of truth for the site redesign. Supersedes the v1 wireframe spec
(HuggingFace-style community catalog + competitive leaderboards — abandoned).
All future work in this repo follows this document.

---

## 1. Purpose

**A try-funnel for ZK engineers.** A visitor arrives skeptical ("Python? that
must be slow"), and leaves having done one of: `pip install` / clone / star.

- Primary persona: a ZK engineer who uses or evaluates provers (SP1, Gnark, …).
- Secondary (later): searching the catalog for a zorch implementation of a
  specific scheme. Not a launch goal.
- Strategic context: this site is the public face of the zorch open-source
  release (first release ships with sp1-zorch, groth16-zorch, flock-zorch).

**Pitch — two pillars, shown together:** *readability × performance*.
"PyTorch for cryptography": provers you can actually read, at GPU speed,
byte-identical to upstream. Never argue one pillar without the other.

## 2. What this is NOT (decisions to not-build)

- No GitHub sign-in, no user accounts.
- No competitive leaderboard pages, no ranking. Benchmark numbers are
  per-library spec-sheet stats, not a contest.
- No abstract "scheme" catalog (Hash/PCS/Argument/Folding entry pages) — that
  two-tier model is deleted. Scheme names survive only as controlled-vocabulary
  attributes on libraries.
- No playground built here — the Try button links to the existing
  `playground.fractalyze.ai` (with a per-library template).
- No Colab notebooks at launch.
- No self-reported benchmark numbers, ever. Maintainers measure; contributors
  never submit numbers (anti-gaming, no large-payload surface).

## 3. Data model — two concepts, two directories

**Entry unit = repo.** One YAML per zorch library. Primitives (a hash, a PCS)
become entries only when they ship as their own repo (e.g. a future
whir-zorch); until then they are attribute values, not entries.

```
libraries/<id>.yaml      # the catalog (contributor-editable via PR)
benchmarks/<id>.yaml     # per-library measured stats (maintainer-only)
snippets/<name>.py       # the library's Run-button/Quickstart code (real .py,
                         # not indentation-sensitive YAML)
schema/                  # JSON Schemas incl. controlled vocabularies
```

### libraries/<id>.yaml

```yaml
id: sp1-zorch                # must equal filename
name: sp1-zorch
type: zkvm                   # enum: core | zkvm | snark | accumulation | pcs
tagline: >-                  # one line, shown on card + detail header (no em-dashes)
  Lean SP1 prover on zorch blocks: byte-identical to upstream, GPU-fast.
repo: https://github.com/fractalyze/sp1-zorch
upstream:                    # what it ports (omit for type: core)
  name: SP1
  repo: https://github.com/succinctlabs/sp1
pypi: sp1-zorch              # optional; package name on PyPI (enables pip buttons)
schemes: [sp1-hypercube]     # optional; end-to-end protocols implemented (NOT primitives)
field: koalabear             # optional, controlled vocab
hash: poseidon2              # optional, controlled vocab
pcs: [basefold]              # optional, controlled vocab (array)
arithmetization: air         # optional, controlled vocab
papers:                      # optional
  - https://eprint.iacr.org/...
license: Apache-2.0          # optional
```

Controlled vocabularies (enforced by schema, extended by PR):
`type` = core | zkvm | snark | accumulation | pcs;
`field` = babybear | koalabear | goldilocks | m31 | bn254 | gf2^128 | pasta;
`hash` = poseidon | poseidon2 | keccak | blake3 | sha256 | monolith;
`pcs` = whir | fri | basefold | ligero | ligerito | kzg | ipa | hyperkzg;
`arithmetization` = air | r1cs | plonkish | ccs.
`schemes` is free kebab-case (protocol names), and must never contain
primitives — a scheme is the end-to-end protocol (groth16, flock,
sp1-hypercube); PCS/hash blocks go in their own fields.

`github_stars` is NOT stored — fetched at build time from the GitHub API.

### benchmarks/<id>.yaml (maintainer-only)

Presentation unit = a labeled stat attached to one library. No cross-library
tables, no profiles/results split, no boards.

```yaml
library: sp1-zorch
stats:
  - label: End-to-end prove                  # what was measured
    value: 1.6                               # numeric stat: value + unit …
    unit: ×                                  # ×, s, ms, MB/s
    baseline: vs SP1's hypercube prover (upstream)
    device: 1× RTX 5090                      # optional
    note: 128-bit security                   # optional methodology one-liner
    featured: true                           # shown on card and home
  - label: Flock PIOP on GPU
    text: First working GPU implementation   # … or a text (milestone) stat
```

### Registration flow

1. **Add a library (anyone):** PR with one `libraries/<id>.yaml`. CI validates
   schema + vocab. Merge → card appears; README is pulled from the repo.
2. **Numbers (maintainers only):** we run the (private, server-side) harness
   and commit `benchmarks/<id>.yaml`. Contributors who want numbers open an
   issue; we measure.

## 4. Launch content (Friday release)

Entries, equal treatment in the grid (no flagship):

| id | type | headline stat |
|---|---|---|
| `zorch` | core | — (the foundation; "JAX-native building blocks for Modern SNARKs") |
| `sp1-zorch` | zkvm | **1.6× vs upstream SP1 hypercube prover** |
| `groth16-zorch` | snark | **2.2× vs Gnark's Groth16 GPU prover** (repo = bellman-zorch, being renamed) |
| `flock-zorch` | snark | **first working GPU implementation of Flock** |
| `zisk-zorch` | zkvm | (added post-launch-scope) pil2-stark on Goldilocks, byte-matched vs pil2-proofman |
| `openvm-zorch` | zkvm | (added) SWIRL on BabyBear, byte-matched vs openvm-stark-backend |
| `accumulation-zorch` | accumulation | (added) ark-accumulation on Pasta, single fused GPU kernel |

All repos go public at/before launch (README fetch + star counts depend on it).

## 5. Site structure

Three page types, one generated static site:

```
/                    Home
  ① Hero — about the FRAMEWORK, not any one port: "write proving schemes in
     Python, run at GPU speed" + code snippet + [pip install ⧉] [Playground ↗]
     [★ GitHub]. No per-library stat here — a number like "1.6× vs SP1" belongs
     to sp1-zorch (cards/Performance), not to a claim about zorch itself.
  ①-b (removed) A stats-teaser bridge ("In our first six months") was tried
     and cut — hero flows straight into the catalog.
  ② Libraries: HF-style catalog — search box + type filter chips + grouped
     facet rows (scheme / primitive / field / arith — one row per level, click
     to filter; the v1 schemes-browse applied to the repo grid). Equal-treatment
     card grid; every card acts directly: [pip install ⧉] + [Run ↗] (playground
     template), plus type tag · tagline · featured stat · ★ · clickable chips
  ③ (removed) Performance section — stats live on the cards; at today's scale a
     separate section only duplicated them. Reintroduce once stats outgrow the
     cards (multiple devices/conditions per library). The trust line ("measured
     by maintainers, never self-reported") stays as a caption under the grid.
  ④ Contribute (#contribute, in-page — no subpage): the FULL guide inline,
     mirroring the hero's text+code layout — community statement, 3 numbered
     steps + policy notes (maintainer-measured numbers, README from repo) on
     the left, a libraries/my-zorch.yaml example in a code window on the right,
     [Open the data repo] [Star] buttons.
/library/<id>        Detail — main column: Quickstart code (full-width; it
                     clipped in the sidebar) from snippets/<name>.py, then the
                     README (build-time fetch) +
                     sidebar: stats panel · composition (field/hash/pcs) ·
                     upstream link · papers · license (pip copy + Run in
                     Playground live in the page header)

Schemes: each library DECLARES the schemes it implements (`schemes: []`,
lowercase kebab-case) — surfaced as the leading card chips and searchable in
the catalog. A dedicated /schemes index page was built and then cut for launch
(at ~5 schemes it only repeated the cards; thin pages make the project look
small — same reasoning as the Performance section). Revive from git history
(816edca) once many libraries share schemes.

Playground deep-link convention: `playground.fractalyze.ai/?template=<library id>`
(the playground team wires the template per library).
```

**Nav:** `[zorch] — Libraries · Contribute — [GitHub ★ n]` (both are home anchors — the site is one page + library details)
(No dropdowns, no tabs: tabs are for different object types (HF's
Models/Datasets/Spaces); we have one — libraries. Playground lives where a
template context exists — hero, cards, detail — not in the nav.)

**Hero assets (from Notion, adapt copy):**
- Pitch: "PyTorch for cryptography" framing — readable, verifiable, GPU-fast.
- Snippet: the `zorch.PCS` Brakedown example (`@zorch.jit`, `zorch.Prover(field=babybear, pcs=Brakedown())`).
- Stat: 1.6× vs SP1 (or rotate the three headline stats).

**Try buttons** link to `playground.fractalyze.ai` (per-library template TBD by
that team; plain link until then).

## 6. Tech & deploy

- **Next.js (App Router) on Vercel**, app lives in `site/`. All pages
  statically generated at build time (SSG) from the root `libraries/` and
  `benchmarks/` YAML. READMEs + star counts fetched from the GitHub API at
  build time (`GITHUB_TOKEN` env for private repos pre-launch; graceful
  fallback to the tagline when a README is unreachable).
- **CI:** `npm run validate` on PR (as today). Vercel builds+deploys `site/`
  on push (preview per PR, production on main).
- Names (zorch/ZKX/…) are placeholders pending the naming round — keep
  branding in one place (site config) so a rename is a one-line change.

## 7. Migration / cleanup in this repo — DONE (2026-07-14)

Old two-tier data, `wireframe/`, boards/profiles/results, and the v1 docs are
deleted. `libraries/` (4 entries), `benchmarks/` (2 stat files), schemas,
scripts, and contributor docs now follow this document. Remaining code work:
the static site generator (§5–6) and the Pages deploy workflow.

## 8. Open items (owner: team)

- [ ] Repos public by launch: zorch, sp1-zorch, bellman-zorch, groth16-zorch, flock-zorch
- [x] bellman-zorch → groth16-zorch rename **dropped** (team, 2026-07-15):
      `fractalyze/groth16-zorch` is a separate project (Python Groth16 prover
      using zorch, the RabbitSNARK counterpart) that exists alongside
      bellman-zorch (GPU prover for Rust bellman). The catalog keeps both:
      entry id reverted to `bellman-zorch`, groth16-zorch registered as the
      8th library
- [ ] Verify headline-stat conditions (device, workload, security bits) for the three numbers
- [x] Playground hookup — done via the `#code` deep link (8a68bb8): the site
      URL-encodes each entry's `quickstart` into the fragment, so no per-library
      template wiring is needed on the playground side
- [ ] Publish PyPI packages and pick a core package name — checked 2026-07-15:
      `zorch` on PyPI is an unrelated squatted package (a pytorch helper), and
      none of the six `<lib>-zorch` names are published. The `pypi:` fields are
      commented out in `libraries/*.yaml` (pip-install buttons hidden) until
      real names exist; the squat is also an input to the naming round. Fill
      each entry's `quickstart` with real, runnable code (zorch core has one)
- [ ] Fill `schemes:` for the zorch core entry (what the building blocks actually cover) —
      seeded only for the three ports so far
- [ ] Confirm per-library Argument coverage (v1 axis: ZeroCheck/Lookup techniques, e.g.
      sp1's sumcheck-zerocheck + logup-gkr) before adding an `argument` vocab axis;
      Folding/Primitive axes wait for libraries that carry them
- [ ] READMEs of the four repos are launch-quality (they render as the detail pages)
- [ ] GitHub Pages enabled on this repo (public) + custom domain decision
