# Benchmarks

Leaderboard numbers are **not contributor-submitted**. They are produced by maintainers running a
hidden test set on pinned hardware, then published here. This keeps the service safe (no
large-payload/DDoS surface) and the leaderboard honest (no self-reported or overfit numbers).

## What's public (in this repo)

- **`boards.yaml`** — the leaderboard boards (`PCS`, `Hash`, `Zkvm`, `Sumcheck` live; `MSM`, `FFT`
  coming soon) and the *methodology* text shown under each.
- **`profiles/*.yaml`** — a benchmark profile fixes the comparison so like is compared with like:
  `board`, `field_class`, `degree`, `device`, and the metric `columns`. Security is a **fixed 128-bit
  assumption** (it only sets FRI queries / blowup), so it is stated in the methodology, not chosen.
- **`results/<profile>.json`** — the measured numbers, one array per profile, keyed by `subject`
  (an entry id) and optional `variant` (e.g. a Sumcheck optimization). Written by maintainer CI.

## What's private (server-side, never committed)

- **`TestInput`** — zkVM ELFs + inputs, hash test vectors. Referenced by content hash only.
- **`SRS` / proving keys** — one canonical ceremony per (curve, max-degree), referenced by hash so
  every trusted-setup scheme is benchmarked against the identical string.
- The **benchmark harness** that runs the above and emits `results/*.json`.

## Adding a result (maintainers)

Run the harness for a profile, drop the emitted `results/<profile>.json`, and open a PR. `npm run
validate` checks that every result references an existing profile and an existing subject entry.
