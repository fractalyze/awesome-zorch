# Prove a Fibonacci sequence with ZisK's stark, then check the proof.
#
# zisk-zorch is ZisK's pil2-stark prover rebuilt on zorch blocks. `InnerProver`
# runs the inner proof over one Fiat-Shamir transcript -- commit the trace, build
# the quotient, then discharge it with a DEEP opening and a FRI low-degree test --
# and `InnerVerifier` is its stage-for-stage dual: Merkle paths against the
# committed roots, the AIR identity at an out-of-domain point, the DEEP
# composition, and the FRI fold chain.
#
# Where the proof lives: in the quotient's DEGREE. The constraints are folded by
# powers of a challenge into one composite C(x), and C vanishes on the trace
# domain H exactly when every constraint holds on every row. Dividing by the
# zerofier x^N - 1 -- which vanishes precisely on H -- leaves a polynomial ONLY
# in that case. Lie about the output and the division leaves a rational function
# whose interpolant runs to full degree, and FRI rejects.
#
# The verifier re-evaluates the AIR at ONE opened row, so constraints are
# row-wise: a row carries (F_i, F_{i+1}, F_{i+2}) and the recurrence is a + b - c.
# `is_first` / `is_last` are committed selector columns, which is what lets one
# AIR carry the boundary rows and the recurrence at once. Change A0, B0 or LOG_N
# and re-run.
import frx.numpy as fnp
import numpy as np
from zk_dtypes import goldilocks as F

from zisk_zorch.prover import InnerProver
from zisk_zorch.transcript.transcript import Transcript
from zisk_zorch.types import InnerClaim, InnerWitness
from zisk_zorch.verifier import InnerVerifier

A0, B0 = 0, 1     # the seed row (F_0, F_1)
LOG_N = 12        # 2^12 = 4096 rows, so the claim is F_4096
POW_BITS = 8      # grinding difficulty on the query-derivation seed
N_QUERIES = 16    # opened positions -- soundness scales with this; zisk opens 64

N = 1 << LOG_N
GOLDILOCKS_P = (1 << 64) - (1 << 32) + 1
N_COLS, N_CONSTRAINTS = 5, 4


def const(value: int):
    """A canonical int as a 0-D base-field scalar. Goes through uint64 because a
    Goldilocks element outgrows int64 -- F_4096 already does. The extension
    embeds the base field, so this also lands in the verifier's cubic row."""
    return fnp.array(np.array(value % GOLDILOCKS_P, dtype=np.uint64), dtype=F)


def fibonacci_trace(a0: int, b0: int, n: int):
    """Row i is (F_i, F_{i+1}, F_{i+2}) plus the two boundary selectors."""
    seq = [a0, b0]
    for _ in range(n):
        seq.append((seq[-2] + seq[-1]) % GOLDILOCKS_P)
    columns = (seq[:n], seq[1 : n + 1], seq[2 : n + 2],
               [1] + [0] * (n - 1), [0] * (n - 1) + [1])
    trace = np.stack([np.array(c, dtype=np.uint64) for c in columns], axis=1)
    return fnp.array(trace, dtype=F), seq[n]


def fibonacci_air(claimed_f_n: int):
    """Four constraints, each vanishing on every row of H."""

    def eval_fn(trace):
        a, b, c, is_first, is_last = (trace[:, i] for i in range(N_COLS))
        return fnp.stack(
            [
                a + b - c,                             # the recurrence, every row
                is_first * (a - const(A0)),            # starts at the given seed,
                is_first * (b - const(B0)),            # both columns
                is_last * (b - const(claimed_f_n)),    # and ends at the claimed F_n
            ],
            axis=-1,
        )

    return eval_fn


trace, f_n = fibonacci_trace(A0, B0, N)
claim = InnerClaim(n_bits=LOG_N, n_cols=N_COLS, n_constraints=N_CONSTRAINTS)


def accepts(claimed_f_n: int) -> bool:
    """Prove the honest trace against a claimed output, then verify. Both roles
    are built from the same AIR; only the claimed F_n differs from run to run, so
    a wrong claim is an AIR the trace does not satisfy."""
    air = fibonacci_air(claimed_f_n)
    shape = dict(n_bits=LOG_N, pow_bits=POW_BITS)
    proved = InnerProver(air, n_queries=N_QUERIES, **shape).prove(
        claim, InnerWitness(trace), Transcript()
    )
    return bool(InnerVerifier(air, **shape).verify(
        claim, proved.reduction_proof, Transcript()
    ).ok)


print(f"proved the ({A0}, {B0}) Fibonacci sequence over {N} rows")
print(f"F_{N} = {f_n}")
print("verifier accepts the honest claim:", accepts(f_n))
print("... and rejects a wrong F_n:      ", not accepts(f_n + 1))
