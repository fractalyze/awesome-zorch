# awesome-zorch

> A curated catalog of everything that runs on
> [zorch](https://github.com/fractalyze/zorch): provers, ports, and
> accumulation schemes, with measured performance.

Browse it at **[awesome-zorch.fractalyze.io](https://awesome-zorch.fractalyze.io)**.

## Why

[zorch](https://github.com/fractalyze/zorch) turns research ideas into
production implementations: JAX-native building blocks for Modern SNARKs
(IOP + PCS), written in readable Python and compiled to fused GPU kernels.
This repo is the platform where the ZK community collaborates on the schemes,
implementations, and benchmarks built on it. Every library below is a real
repo you can `pip install`, and every performance number is measured by
maintainers on pinned hardware against upstream, never self-reported.

## Libraries

### Core

- [zorch](https://github.com/fractalyze/zorch) - JAX-native building blocks
  for Modern SNARKs (IOP + PCS). Proving-scheme- and zkVM-agnostic,
  fusion-first.

### zkVM provers

- [sp1-zorch](https://github.com/fractalyze/sp1-zorch) - Lean SP1 prover on
  zorch blocks. 1.6x vs SP1's hypercube prover (upstream).
- [zisk-zorch](https://github.com/fractalyze/zisk-zorch) - Lean ZisK prover:
  pil2-stark on Goldilocks, byte-matched against pil2-proofman.
- [openvm-zorch](https://github.com/fractalyze/openvm-zorch) - Lean OpenVM
  prover: SWIRL on BabyBear with WHIR PCS, byte-matched against
  openvm-stark-backend.

### SNARK provers

- [bellman-zorch](https://github.com/fractalyze/bellman-zorch) - GPU Groth16
  prover for bellman (BN254), byte-identical to groth16::create_proof.
  2.2x vs Gnark's Groth16 GPU prover.
- [groth16-zorch](https://github.com/fractalyze/groth16-zorch) - Groth16
  prover in Python using zorch, the Python counterpart of RabbitSNARK.
  Input/output compatible with the circom/snarkjs ecosystem.
- [flock-zorch](https://github.com/fractalyze/flock-zorch) - GPU port of
  Flock: R1CS-over-GF(2^128) PIOP with BaseFold/Ligerito PCS. First working
  GPU implementation.

### Accumulation

- [accumulation-zorch](https://github.com/fractalyze/accumulation-zorch) -
  The arkworks ark-accumulation prove path over the Pasta cycle, run as a
  single fused GPU kernel, byte-identical to the reference prover.

## How it works

One YAML file per library under [`libraries/`](libraries/); maintainer-measured
stats under [`benchmarks/`](benchmarks/). CI validates every entry against
[`schema/`](schema/), and the [site](https://awesome-zorch.fractalyze.io)
rebuilds from `main` on every merge.

## Contributing

Built something on zorch? Register it with one YAML file, reviewed by PR.
See [CONTRIBUTING.md](CONTRIBUTING.md). Benchmark numbers are measured and
committed by maintainers only; open an issue to request a run.

## Development

```bash
npm install && npm run validate   # check the data
npm test                          # validator unit tests

cd site && npm install
npm run dev                       # the Next.js site, from the YAML one level up
```

Design doc: [design.md](design.md). License: [Apache-2.0](LICENSE).
