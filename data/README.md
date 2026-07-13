# data/

The catalog. **One YAML file per entry**, and the file's `id` equals its path:
`data/pcs/whir.yaml` → `id: pcs/whir`.

| Directory | Category | Tier | Browsable on the site? |
|---|---|---|---|
| `hash/` | Hash | abstract primitive | yes |
| `pcs/` | PCS | abstract primitive | yes |
| `arg/` | Argument (relation × technique) | abstract primitive | yes |
| `fold/` | Folding | abstract primitive | yes |
| `prim/` | Primitive (Sumcheck, MSM, FFT) | abstract primitive | yes |
| `impl/` | Implementation (`Zkvm`/`Snark`/`Accumulation`) | concrete | yes |
| `field/` | Field | attribute | no (referenced + a leaderboard axis) |
| `arith/` | Arithmetization | attribute | no (referenced) |

Abstract primitives stay **field-agnostic** and declare dependency slots via `needs` (categories,
not ids). Implementations fill slots with concrete entry ids. Full field reference:
[`../schema.md`](../schema.md); machine schema: [`../schema/entry.schema.json`](../schema/entry.schema.json).

Validate any change with `npm run validate` from the repo root.
