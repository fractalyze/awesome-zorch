# awesome-zorch — Data Schema

Two tiers:

- **Abstract primitives** (`Hash`, `PCS`, `Argument`, `Folding`, `Primitive`) are
  **field-agnostic and reusable**. They declare *dependency slots by category* —
  never concrete cross-field bindings.
- **Concrete implementations** (`Implementation`) **bind everything** (field, hash,
  params…) by *filling* those slots, and are what the leaderboard benchmarks.

`Field` and `Arithmetization` are **attributes, not browsable categories** — they
are values an implementation carries (and a leaderboard axis), not things you curate
on their own.

The GitHub data repo holds **only public metadata**. Large or gameable assets
(test inputs, SRS/keys) live **server-side**, referenced by content hash.

---

## Conventions

- One public entry = one file (JSON/YAML) in the data repo, submitted by PR.
- Dependencies are **slots by category**, not concrete edges. An abstract entry
  says *which kind* it needs (`PCS "WHIR" needs [Hash]`); a concrete
  `Implementation` *fills* the slot (`sp1-zorch.hash = Poseidon2, over BabyBear`).
- `id` is a stable slug: `pcs/whir`, `hash/poseidon2`, `impl/sp1-zorch`.

---

## Base

```
Common:
  id            string
  name          string
  category      Category
  description   string
  repo, version, homepage, docs   string?
  paper_links   string[]
  authors, languages, tags        string[]
  license       string?
  created_at, updated_at          date
  github_stars  int?              # auto-fetched; powers "Trending"

Category = { Hash, PCS, Argument, Folding, Primitive, Implementation }
```

---

## Abstract tier — field-agnostic primitives

### Hash
```
Hash(Common):
  arithmetization_friendly  bool                     # algebraic-over-a-field vs bit-oriented
  construction              { Sponge, Compression }
  field_requirement         FieldRequirement         # almost always FieldAgnostic
  ref                       RefImpl?
# algebraic: Poseidon2, Monolith, Rescue    bit-oriented: Keccak, Blake3, SHA-256
```

### PCS
```
PCS(Common):
  assumption        SecurityAssumption
  post_quantum      bool                          # derivable from assumption
  setup_type        { Transparent, UniversalTrusted }
  field_requirement FieldRequirement
  polynomial_type   { Univariate, Multilinear }
  homomorphic       bool
  hiding            { None, Computational, Perfect }
  binding           { Computational, Perfect }
  prover_complexity     string   # "O(n log n)"
  verifier_complexity   string   # "O(log n)"
  proof_size_class      string   # "O(log^2 n)"
  setup_note        string?      # e.g. SRS size at a reference degree (see server-side assets)
  needs: [Hash]                  # dependency slot
  srs               AssetRef?    # server-side; present iff setup_type == UniversalTrusted

SecurityAssumption = { Hash, DiscreteLog, Pairing, UnknownOrderGroup, Lattice }
FieldRequirement   = { FieldAgnostic, PairingCurve, PrimeOrderGroup, Lattice }
```

`setup_type` dropped `PerCircuitTrusted` — per-circuit trusted setup is a **SNARK**
property (Groth16), not a PCS one, and it's being deprecated. `Transparent` = no
trusted setup (public randomness only, no toxic waste). `UniversalTrusted` = one
reusable SRS ceremony good for all circuits up to a size bound (KZG).

`field_requirement` is the **"what does this need to be instantiated" filter** — it
lets someone assembling a SNARK narrow to field-agnostic primitives or find the ones
that need a specific curve (KZG → `PairingCurve`, IPA → `PrimeOrderGroup`).

### Argument — relation × technique
```
Argument(Common):
  relation    { ZeroCheck, Lookup, Permutation }
  technique   string     # "Sumcheck-based" | "Quotient-based" | "LogUp-GKR" | ...
  needs: [PCS?]
# Sumcheck-based ZeroCheck   (SP1)    Quotient-based ZeroCheck   (Zisk)    LogUp-GKR (Lookup)
```

### Folding / Accumulation
```
Folding(Common):
  needs:   [PCS]
  decider  Ref<Implementation>?   # final SNARK compressing the accumulator (often Groth16)
# Nova, SuperNova, HyperNova, ProtoStar, ProtoGalaxy, Mova
```

### Primitive — benchmarkable low-level building blocks
Things where *"make it faster"* is the contribution, ranked on their own board.
```
Primitive(Common):
  benchmarkable  bool
  status         { live, coming-soon }?
  gate           string?          # if coming-soon: what unblocks it
  optimizations  [{ name, note, paper? }]?   # variants that compete on the board
# Sumcheck   live — variants: Univariate Skip, SVO, eval-domain switch
# MSM, FFT   coming-soon — gated on an XLA opcode + codegen (Pasta backends seed them first)
```

---

## Concrete tier

### Implementation — the uploaded, benchmarked card
```
Implementation(Common):
  kind             { Zkvm, Snark, Accumulation }
  ref              RefImpl
  pypi             { name, version }?         # if published (the stack is Python-heavy)

  # slot fills (all concrete here)
  field            Ref<Field>                 # attribute + leaderboard axis
  hash             Ref<Hash>?
  pcs              Ref<PCS>?
  arithmetization  Ref<Arithmetization>?      # attribute tag (AIR / R1CS / …)
  arguments        Ref<Argument>[]
  folding          Ref<Folding>?
  decider          Ref<Implementation>?       # accumulation-zorch → groth16
  trace_layout     { Dense, Jagged }?         # cross-cutting technique
  trusted_setup    string?                    # e.g. "per-circuit" for Groth16
  setup_note       string?                    # e.g. proving-key size
  parameters       { security_bits: int, extra: map }

RefImpl: { repo, version, commit? }
```

Concrete seeds: `sp1-zorch`, `openvm-zorch`, `zisk-zorch` (`Zkvm`), `groth16` (`Snark`,
`trusted_setup: per-circuit`), `accumulation-zorch` (`Accumulation`, `decider = groth16`).

---

## Server-side assets — never in the git data repo

```
AssetRef: { id, url, hash }   # hash pins exactly what was benchmarked

ZkvmTestInput:  { elf, input }              # DDoS / large-payload risk
HashTestInput:  { field, length, vectors }
SRS / ProvingKey: one canonical ceremony per (curve, max-degree)
```

Rule: **public metadata → git; big or gameable → server-side, by hash.** Same
decision for `TestInput`, `SRS`, and the hidden benchmark vectors.

---

## Benchmarks — server-side; rendered on Leaderboard & Detail

```
Board          { PCS, Hash, Zkvm, Sumcheck, MSM(soon), FFT(soon) }
  + methodology string     # "how this is measured", shown under the board

BenchmarkProfile:            # a Board fixes one axis; the rest are selectors
  board        Board
  field_class  string       # "64-bit prime" | "BN254" | ...
  degree       string       # "2^24" | "Keccak-256 ×100" | ...
  device       string       # pinned machine class
  columns      Column[]     # metric key/label/unit/lower-is-better; one is `primary`

BenchmarkResult:
  subject      Ref
  profile      Ref<BenchmarkProfile>
  variant      string?      # e.g. a Sumcheck optimization name
  <metric keys per the profile's columns>
```

- **Security is a fixed assumption (128-bit), not a selector** — it sets FRI query
  counts / blowup etc., so it's stated in the methodology, not chosen.
- Selectors are **degree · field · device**; every board and every card states all
  three next to the numbers.
- Trusted-setup schemes carry a **setup-key size** column/metadata (KZG SRS,
  Groth16 proving key), since it grows with degree and matters in practice.
- Ranked by the `primary` column; the *theoretical* asymptotics
  (`*_complexity`) live on the entry, only the *measured* numbers rank the board.
