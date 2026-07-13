<!-- Adding or updating a catalog entry? Fill this in. For code/docs changes, delete it. -->

## What this adds

<!-- e.g. "Adds impl/my-zorch (a zkVM implementation)" or "Updates pcs/whir complexities" -->

- Entry id(s):
- Category:

## Checklist

- [ ] One entry per file at `data/<category>/<slug>.yaml`, and the file's `id` equals its path (e.g. `data/pcs/whir.yaml` → `id: pcs/whir`).
- [ ] `npm run validate` passes locally (schema + reference integrity).
- [ ] Every slot (`field`, `hash`, `pcs`, `arithmetization`, `arguments`, `folding`, `decider`) points at an **existing** entry id — if a primitive is missing, add it in this PR too.
- [ ] Abstract primitives stay **field-agnostic** (no field pinned); only an `Implementation` binds a concrete field/hash/params.
- [ ] **No benchmark numbers** — those are produced server-side on a hidden test set, not submitted here.
- [ ] Links (repo, papers, homepage) resolve.

## Notes for reviewers

<!-- anything non-obvious about the entry -->
