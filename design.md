# awesome-zorch — Wireframe / Build Spec

A HuggingFace-style hub for the ZK/crypto community. Contributors open PRs against
a **data-only GitHub repo**; this site renders that data as browsable listings and
apples-to-apples leaderboards. Goal: drive participation, curate implementations,
and converge the community on a shared standard.

- **Audience of this spec:** the developer who will build the real site.
- **Deliverable:** the clickable mock under [`wireframe/`](wireframe/) is the source
  of truth for layout, navigation, and interactions. This doc explains the *why*.
- **Data model:** see [`schema.md`](schema.md).

---

## Architecture the mock demonstrates

```
GitHub data repo (public metadata, PR-only)      Server (yours, private)
   entries: schemes + implementations   ─────►   • hidden TestInput (ELF/input, hash vectors)
        │                                         • canonical SRS / proving keys (by hash)
        │  site reads it                          • runs benchmarks → BenchmarkResult
        ▼                                                 │
   Static site (this wireframe)  ◄──────────────── numbers published back
```

[`wireframe/data.js`](wireframe/data.js) plays the role of the data repo; every page
renders from it. Contributors never submit benchmark numbers — the server produces
them against a hidden test set, addressing both DDoS risk and leaderboard gaming.

---

## Taxonomy (drives Browse + Detail)

```
ABSTRACT (field-agnostic; deps are slots by kind)
  Hash · PCS · Argument(relation×technique) · Folding · Primitive
CONCRETE (binds field/hash/params; benchmarked)
  Implementation{ kind: Zkvm | Snark | Accumulation }
```

- `Field` and `Arithmetization` are **attributes**, not browsable categories (an
  implementation carries them; `Field` is also a leaderboard axis).
- `Argument` = **relation × technique** → ZeroCheck is *Sumcheck-based* (SP1) or
  *Quotient-based* (Zisk); Lookup = LogUp-GKR.
- `Primitive` = benchmarkable low-level blocks: **Sumcheck** (live; optimizations
  like Univariate Skip / SVO compete as variants) and **MSM / FFT** (coming-soon,
  gated on an XLA opcode + codegen).
- `Folding` carries a `decider` (often Groth16) — which is why Groth16 is a
  first-class `Implementation{Snark}`.

---

## The five screens

### 1. Home
Hero (see [`home.md`](home.md)) · `Recently added / Trending` tabs · leaderboard
teasers. Teasers show a **random 3** of the live boards each refresh (so more than
three boards can exist without crowding the page), each with device · field · degree.

### 2. Implementations (browse — concrete tier)
Filterable card grid of the `*-zorch` entries. Filters: kind, field, post-quantum.

### 3. Schemes (browse — abstract tier)
Faceted grid of primitives (Hash / PCS / Argument / Folding / Primitive). The facets
are **"what your SNARK needs, so you can combine"**: category, **field requirement**
(field-agnostic vs needs pairing / prime-order curve), PCS setup, polynomial type,
post-quantum. (A future step: turn the facet-narrowing into an explicit
pick-one-per-layer "build a stack" flow.)

### 4. Detail — two flavors
- **Implementation detail** (HuggingFace model-card style): **README in the left
  main body**, **metadata in the right sidebar** — a Metadata panel, the
  **composition** (clickable stack of the primitives it uses), a dedicated
  **Papers** panel (aggregated from the entry + every scheme it uses), an
  **Install (PyPI)** panel, and a Benchmarks table.
- **Scheme detail:** properties, requires-slots + field requirement, dedicated
  Papers panel, and **"Used by"** (reverse graph edge). Primitive pages list their
  optimizations; coming-soon primitives show the gate.

### 5. Contribute
The PR-only data flow: schema, a "generate your entry" form, what's benchmarked,
and that `TestInput`/`SRS` stay server-side.

---

## Leaderboard mechanics

- **Board navigation on the left** fixes the big axis: PCS · Hash · zkVM · Sumcheck
  (live) and MSM · FFT (coming-soon — clickable to see the gate, no table yet).
- Then **degree · field · device** selectors pick the profile; a **single-series
  bar graph** (magnitude, one accent hue, direct value labels — dataviz rules) plus
  a table render below, followed by a **"how this is measured"** methodology note.
- **Security is a fixed 128-bit assumption**, stated in the methodology — not a
  selector (it just sets FRI queries / blowup, so it isn't a comparison axis).
- **Trusted-setup schemes show a setup-key-size column** (KZG SRS, Groth16 proving
  key) — it grows with degree and matters in practice.
- **Hidden test set:** the server runs the benchmarks and publishes numbers;
  contributors submit only the implementation.
- Every board, teaser, and detail bench states **device · field · degree** next to
  the numbers.

---

## Viewing the mock

```bash
npm install && npm run build                   # generates wireframe/data.js from data/
cd wireframe && python3 -m http.server 8000    # then open http://localhost:8000
```
(After building, `wireframe/index.html` also opens directly from `file://` — the generated
`data.js` is a plain script, no `fetch`/modules. The production site instead fetches `dist/data.json`.)

Pages: `index.html` · `implementations.html` · `schemes.html` · `leaderboard.html`
· `contribute.html` · `implementation.html?id=…` · `scheme.html?id=…`.
Shared: `styles.css` · `data.js` (mock data) · `app.js` (chrome + rendering).
