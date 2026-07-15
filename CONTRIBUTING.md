# Contributing to awesome-zorch

Everything here is data. You contribute by adding or editing one YAML file and
opening a PR. CI validates it; a maintainer reviews and merges; the site
rebuilds from `main`.

## Add a library

Create `libraries/<id>.yaml`. The `id` must equal the filename.

```yaml
id: my-zorch
name: my-zorch
type: zkvm                # core | zkvm | snark | pcs
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
quickstart: |             # optional: minimal runnable snippet for the detail page
  import my_zorch
  proof = my_zorch.prove(input)
papers:                   # optional
  - https://eprint.iacr.org/...
license: Apache-2.0       # optional
```

Then validate locally and open the PR:

```bash
npm install && npm run validate
```

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
