# Contributing to awesome-zorch

Everything here is data. You contribute by adding or editing one YAML file and
opening a PR. CI validates it; a maintainer reviews and merges; the site
rebuilds from `main`.

## Add a library

Create `libraries/<id>/<id>.yaml` (one folder per library). The `id` must
equal the folder name.

```yaml
id: my-zorch
name: my-zorch
type: zkvm                # core | zkvm | snark | accumulation | pcs
tagline: >-
  One line about what this is and why it matters.
repo: https://github.com/you/my-zorch
upstream:                 # the project you ported (omit for type: core)
  name: My-zkVM
  repo: https://github.com/you/my-zkvm
pypi: my-zorch            # optional: PyPI package name (enables the pip button)
schemes: [my-scheme]      # optional: end-to-end protocols this implements
field: koalabear          # optional, controlled vocabulary
hash: poseidon2           # optional, controlled vocabulary
pcs: [basefold]           # optional, controlled vocabulary
arithmetization: air      # optional: air | r1cs | plonkish | ccs
papers:                   # optional
  - https://eprint.iacr.org/...
license: Apache-2.0       # optional
```

Then validate locally and open the PR:

```bash
npm install && npm run validate
```

## Runnable snippet (the Run button)

A snippet is one Python file co-located with your entry:
`libraries/<id>/<id>.py` — same name as the folder, picked up automatically,
no YAML field. It powers every Run surface: the card's **Run ↗**, the detail
page's **Quickstart** section and **Run in Playground** button. Without a
snippet those Run buttons are hidden, so shipping one is what makes your
entry try-able.

How it travels: the site URL-encodes the file into the playground link's
`#code` fragment. The code never touches a server — the playground opens with
your snippet as its only tab and the visitor presses Run there.

**It must run as-is on the playground box.** That box is a shared RTX 5090
with an 8 GiB VRAM cap, a 60 s wall clock, sandboxed, running the
playground's pinned zorch + jax stack. Concretely:

- **Self-contained only** — no CLI args, no input files, no network. If your
  library needs artifacts to prove (proving keys, witness files), it can't
  have a snippet yet; the entry then links to the bare playground instead.
- **Imports must exist in the pinned stack** (zorch, jax, zk_dtypes). Your
  own package is NOT installed there — a snippet demonstrates the scheme on
  zorch building blocks, not your PyPI package.
- **Budget the 60 s for compile + run.** The first run JIT-compiles; size the
  instance so compile plus prove finish comfortably inside the wall clock.
- **Fit the VRAM cap** — stay well under 8 GiB at your default constants.

Shape it like an instrument, not a listing:

- Open with a comment block saying what the snippet demonstrates and why it
  matters (this doubles as the Quickstart's introduction).
- Expose the inputs as **editable constants at the top** (`LOG_N`, `A, B, C`)
  and derive everything below from them, so a reader can edit and re-run to
  prove a different instance. Say so in a comment, including safe ranges
  (e.g. `LOG_N` 10..24).
- End with `print` lines that prove success on their own — the verifier's
  accept (`verifier accepts: True`) plus one line of instance scale (rounds,
  sizes). The console is the payoff; make it legible.
- Keep it under ~50 lines of code. It's a pitch, not a test suite.

Before opening the PR, paste the file into the playground and press Run —
"works on my machine" doesn't count; the button ships exactly this file.

## Schemes vs. primitives

- `schemes` lists the **end-to-end protocols** your library implements
  (`groth16`, `flock`, `sp1-hypercube`). One library usually implements one.
- **Primitives are not schemes.** The building blocks used inside — PCS, hash —
  go in their own fields (`pcs`, `hash`), never in `schemes`.

All of these values come from the controlled vocabularies in
[`schema/library.schema.json`](schema/library.schema.json), lowercase
kebab-case. If a value you need is missing, extend the enum in the same PR.

## What does NOT go here

- **Benchmark numbers.** `benchmarks/<id>.yaml` is maintainer-only: numbers are
  measured by maintainers on pinned hardware and committed here. Want your
  library measured? Open an issue.
- **READMEs / long docs.** The site renders your repository's README at build
  time. Keep the entry to metadata.
- **Large binaries** of any kind.

## Benchmark files (maintainers)

One file per library, `benchmarks/<id>.yaml`, `library` equal to the filename:

```yaml
library: my-zorch
stats:
  - label: End-to-end prove          # what was measured
    value: 1.6                       # numeric stat: value + unit
    unit: ×
    baseline: vs upstream My-zkVM    # optional comparison phrasing
    device: 1× RTX 5090              # optional
    note: 128-bit security           # optional methodology one-liner
    featured: true                   # shown on the card and home
  - label: Flock PIOP on GPU
    text: First working GPU implementation   # milestone stat: text instead of value/unit
```
