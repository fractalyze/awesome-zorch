# flock proves a binary-field R1CS over GF(2^128). Its full prover runs four
# stages over one Fiat-Shamir transcript: Ligerito commit+bind → zerocheck →
# lincheck → batched Ligerito open (`prover.prove_fast`). This snippet runs the
# *zerocheck* on its own — the R1CS Hadamard check  a ∘ b = c  (a_i · b_i = c_i on
# every row) — because it is the one stage whose inputs are pure data (a, b, c, m);
# the others need a Ligerito config schedule + statement digest that flock only
# emits from its Rust reference, so they are not self-contained in Python.
#
# The zerocheck is a sumcheck that  eq(r, x) · (a(x)·b(x) − c(x))  sums to zero
# over the boolean hypercube, which holds iff the gate holds on every row. Below
# builds a satisfying witness (c = a AND b) and runs `zerocheck.prove_packed`, the
# exact call flock-zorch byte-matches against upstream flock. Every field multiply
# is a GF(2^128) carryless multiply on the GPU. Change M (>= 13) and re-run.
import numpy as np
import frx

frx.config.update("jax_enable_x64", True)  # F128 lanes are two uint64s

from flock_zorch import zerocheck  # noqa: E402

M = 16  # 2^16 = 65,536 R1CS rows
DOMAIN = b"awesome-zorch-flock"  # Fiat-Shamir domain separator


def bits():
    """A packed random bit-vector of length 2^M, the wire form flock's prover
    ingests (one bit per R1CS row)."""
    return np.unpackbits(rng.integers(0, 256, (1 << M) // 8, dtype=np.uint8), bitorder="little")


rng = np.random.default_rng(0)
a, b = bits(), bits()
c = a & b  # the satisfying witness: over GF(2), a_i · b_i is a_i AND b_i

proof = zerocheck.prove_packed(a, b, c, M, DOMAIN)

print(f"R1CS Hadamard proof over GF(2^128): 2^{M} rows")
print(f"zerocheck: 1 univariate-skip round + {len(proof.multilinear_rounds)} multilinear rounds")
print("final a, b, c each bound to one GF(2^128) point")
