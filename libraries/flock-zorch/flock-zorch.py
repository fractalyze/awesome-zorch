# flock proves a binary-field R1CS over GF(2^128) in four stages over one
# Fiat-Shamir transcript: Ligerito commit+bind → zerocheck (the Hadamard gate
# a ∘ b = c) → lincheck (a = A·z, b = B·z) → batched Ligerito open.
# `prover.prove_fast` fuses all four into one device call. Below builds an
# identity R1CS (A = B = C = I, so a = b = c = z) entirely in Python — the witness
# packed by `pcs.pack`, no fixture — and runs the whole prover. Every field
# multiply is a GF(2^128) carryless multiply on the GPU. Change M (>= 13) and re-run.
import numpy as np
import frx

frx.config.update("jax_enable_x64", True)  # an F₂¹²⁸ element is two uint64 lanes

from flock_zorch import prover  # noqa: E402
from flock_zorch.pcs.pack import pack_witness, pack_z_lincheck_from_packed  # noqa: E402

M, K_LOG, K_SKIP = 13, 8, 6  # 2^M R1CS rows; K_LOG = block size, K_SKIP = zerocheck skip

# The Ligerito recursive-open schedule: fold widths, code rate, query count, and
# grinding per level (initial commit + one recursive step).
CFG = dict(initial_k=2, recursive_ks=[2], log_inv_rates=[1, 2], queries=[4, 3],
           grinding_bits=[1, 0], fold_grinding_bits=[1, 0], ood_samples=[0, 1],
           recursive_steps=1)

# Any bit witness satisfies the identity gate z ∘ z = z (bit² = bit). Pack it into
# the two wire forms prove_fast reads: F₂¹²⁸ lanes (commit + zerocheck) and the
# lincheck bytes.
z_bits = np.random.default_rng(0).integers(0, 2, 1 << M).astype(np.uint8)
z_packed = pack_witness(z_bits, M)
z_lincheck = pack_z_lincheck_from_packed(z_packed, M, K_LOG)
eye = np.eye(1 << K_LOG, dtype=np.uint64)  # A = B = I
statement = bytes(range(32))               # opaque R1CS instance digest

proof = prover.prove_fast(z_packed, M, K_LOG, K_SKIP, eye, eye,
                          z_lincheck, statement, CFG)

print(f"R1CS proof over GF(2^128): 2^{M} rows, all four stages")
print(f"  zerocheck : {len(proof.zerocheck.multilinear_rounds)} multilinear rounds")
print(f"  lincheck  : {len(proof.lincheck[0])} rounds")
print(f"  PCS open  : {len(proof.pcs_open.ring_switches)} ring-switched claims + Ligerito")
