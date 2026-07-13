# Contributing to awesome-zorch

Everything here is **data**. You contribute by adding or editing one YAML file per catalog entry
and opening a PR. CI validates it; a maintainer reviews and merges; the website picks it up from
`main`.

## Add an entry in 4 steps

1. **Fork & branch.**
2. **Create one file** at `data/<category>/<slug>.yaml`. The `<category>` directory doubles as the id
   prefix, so **the file's `id` must equal its path**:

   | Category | Directory | Example id |
   |---|---|---|
   | Hash | `data/hash/` | `hash/poseidon2` |
   | PCS | `data/pcs/` | `pcs/whir` |
   | Argument | `data/arg/` | `arg/logup-gkr` |
   | Folding | `data/fold/` | `fold/nova` |
   | Primitive | `data/prim/` | `prim/sumcheck` |
   | Implementation | `data/impl/` | `impl/sp1-zorch` |
   | Field / Arithmetization | `data/field/`, `data/arith/` | `field/babybear`, `arith/air` |

3. **Validate locally:** `npm install && npm run validate`.
4. **Open a PR** and fill in the checklist.

Slugs are lowercase `[a-z0-9-]`. Copy the closest existing file as a starting point.

## The two tiers

**Abstract primitives are field-agnostic.** A `PCS`/`Hash`/`Argument`/`Folding`/`Primitive` entry
describes the *scheme*, and declares what kind of thing it depends on via `needs` (a list of
categories, e.g. `needs: [Hash]`) — it never names a concrete field or hash.

**Implementations bind everything.** An `Implementation` fills the slots with concrete entry ids:

```yaml
id: impl/my-zorch
name: my-zorch
category: Implementation
kind: Zkvm
description: GPU-accelerated port of My-zkVM on the Zorch stack.
ref: { repo: https://github.com/me/my-zkvm, version: "1.0.0" }
pypi: { name: my-zorch, version: "0.1.0" }
field: field/babybear          # slot fills reference existing entry ids
hash: hash/poseidon2
pcs: pcs/whir
arithmetization: arith/air
arguments: [arg/sumcheck-zerocheck, arg/logup-gkr]
trace_layout: Jagged
parameters: { security_bits: 128 }
license: Apache-2.0
languages: [Rust, Python]
```

If a slot references a primitive that doesn't exist yet, **add that primitive in the same PR**.

## Rules the validator enforces

- Every entry matches its category's schema (`schema/entry.schema.json`), with the right enums.
- `id` equals the file path; ids are unique.
- Every slot (`field`, `hash`, `pcs`, `arithmetization`, `arguments[]`, `folding`, `decider`)
  resolves to an existing entry.

## What does *not* go here

- **Benchmark numbers.** Performance is measured server-side on a hidden test set and published by
  maintainers to `benchmarks/results/`. Submitting numbers in a PR will be removed.
- **Large binaries** — ELFs, inputs, SRS/keys. These are server-side, referenced by hash. See
  [`benchmarks/README.md`](benchmarks/README.md).
- **READMEs / long docs.** Point `ref`/`pypi` at your upstream; the site renders that README.

## Editing existing entries

Fixing a description, complexity, or link is welcome — edit the file and open a PR. Changing an
entry's `id` (renaming a file) is a breaking change; call it out explicitly so links can be updated.
