# Prove a Fibonacci sequence with ZisK's stark, then corrupt one row and watch
# the proof fail.
#
# zisk-zorch is ZisK's pil2-stark prover rebuilt on zorch blocks. A pil2 proof
# runs five stages over one Fiat-Shamir transcript -- trace commit, LogUp
# grand-sum, quotient, DEEP-ALI composition, and the FRI low-degree test. Three
# of those are self-contained and run below on a real AIR; the LogUp and DEEP
# stages need a starkinfo proving key, which a snippet cannot build.
#
# Where the proof lives: in the quotient's DEGREE. The constraints are folded by
# powers of a challenge into one composite C(x), and C vanishes on the trace
# domain H exactly when every constraint holds on every row. Dividing by the
# zerofier x^N - 1 -- which vanishes precisely on H -- leaves a polynomial ONLY
# in that case. Corrupt a row and the division leaves a rational function whose
# interpolant runs to full degree, so FRI's terminal degree check rejects. The
# last two lines are that experiment.
#
# Everything is editable: change the seed (A0, B0) or LOG_N and re-run to prove
# a different sequence. LOG_N 8..16 all finish comfortably.
import frx.numpy as fnp
import numpy as np
from zk_dtypes import goldilocks as F
from zk_dtypes import goldilocksx3 as F3

from zisk_zorch.commit.trace_commit import commit_trace, extend
from zisk_zorch.fri.prover import prove, prove_queries
from zisk_zorch.fri.queries import sample_query_positions
from zisk_zorch.fri.verifier import verify
from zisk_zorch.quotient.quotient import quotient_from_constraints
from zisk_zorch.transcript.transcript import Transcript
from zorch.poly.univariate import powers
from zorch.utils.field import join_coeffs

A0, B0 = 0, 1    # the seed row (F_0, F_1)
LOG_N = 12       # 2^12 = 4096 rows, so the claim is F_4096
LOG_BLOWUP = 1   # LDE rate; the quotient needs an extended domain
ARITY = 4        # Merkle arity of every committed tree
N_QUERIES = 4    # opened positions -- real pil2 proofs open ~64, see below
POW_BITS = 8     # grinding difficulty on the query-derivation seed

N, BLOWUP = 1 << LOG_N, 1 << LOG_BLOWUP
GOLDILOCKS_P = (1 << 64) - (1 << 32) + 1
# Fold 4 bits per layer, twice. Folding less is slower, not faster: a shorter
# chain leaves a longer final polynomial, and the verifier INTTs all of it.
STEPS = [LOG_N + LOG_BLOWUP - 4 * i for i in range(3)]


def const(value: int):
    """A canonical int as a 0-D field scalar. Goes through uint64 because a
    Goldilocks element outgrows int64 -- F_4096 already does -- and a bare
    Python int that large cannot cross into a jitted computation."""
    return fnp.array(np.array(value % GOLDILOCKS_P, dtype=np.uint64), dtype=F)


def fibonacci_trace(a0: int, b0: int, n: int, corrupt: int | None = None):
    """The witness: row i is (F_i, F_{i+1}), plus three boundary selectors.

    ZisK's zerofier is `everyRow`, so a constraint must vanish on ALL of H --
    there is no is_first/is_last builtin to lean on. The selectors are committed
    columns instead, which is what lets one AIR carry both the boundary rows and
    the recurrence. `is_transition` is 0 on the last row, whose successor wraps
    around the cyclic domain and is not F_{n+1}.
    """
    a, b = [a0], [b0]
    for _ in range(n - 1):
        a_i, b_i = a[-1], b[-1]
        a.append(b_i)
        b.append((a_i + b_i) % GOLDILOCKS_P)
    if corrupt is not None:
        b[corrupt] = (b[corrupt] + 1) % GOLDILOCKS_P  # one wrong row
    columns = (a, b, [1] + [0] * (n - 1), [1] * (n - 1) + [0], [0] * (n - 1) + [1])
    trace = np.stack([np.array(c, dtype=np.uint64) for c in columns], axis=1)
    return fnp.array(trace, dtype=F), b[-1]


def fibonacci_air(claimed_f_n: int):
    """The five constraints, each gated by a selector so it vanishes on all of H.

    Next-row access is `fnp.roll(col, -BLOWUP)`: one row of H is a rotation by
    the blowup factor once the trace sits on the extended domain.
    """

    def eval_fn(trace):
        a, b, is_first, is_transition, is_last = (trace[:, i] for i in range(5))
        a_next, b_next = fnp.roll(a, -BLOWUP), fnp.roll(b, -BLOWUP)
        return fnp.stack(
            [
                is_first * (a - const(A0)),            # starts at the given seed,
                is_first * (b - const(B0)),            # both columns
                is_transition * (a_next - b),          # a' = b
                is_transition * (b_next - a - b),      # b' = a + b
                is_last * (b - const(claimed_f_n)),    # ends at the claimed F_n
            ],
            axis=-1,
        )

    return eval_fn


def prove_fibonacci(claimed_f_n: int, corrupt: int | None = None) -> bool:
    """Commit the witness, build the quotient, prove it low-degree, verify.

    One transcript threads the whole thing: the trace root is absorbed before
    the constraint-folding challenge is squeezed, and the FRI betas and query
    positions come off that same running state -- pil2's genProof byte order.
    """
    trace, _ = fibonacci_trace(A0, B0, N, corrupt)
    commitment = commit_trace(trace, blowup=BLOWUP, arity=ARITY)

    transcript = Transcript()
    transcript.put(commitment.root)
    alpha = powers(join_coeffs(transcript.get_field().reshape(-1, 3), F3).reshape(()), 5)
    quotient = quotient_from_constraints(
        fibonacci_air(claimed_f_n), extend(trace, BLOWUP), alpha, LOG_N, LOG_BLOWUP
    )

    proof = prove(quotient, STEPS, arity=ARITY, transcript=transcript)
    # The prover derives its query positions from the post-fold transcript and
    # grinds a nonce; the verifier re-derives both rather than trusting them.
    indices, nonce = sample_query_positions(
        transcript, proof.final_pol, pow_bits=POW_BITS,
        n_queries=N_QUERIES, n_bits_ext=STEPS[0],
    )
    openings = prove_queries(proof, indices)

    replay = Transcript()
    replay.put(commitment.root)
    replay.get_field()
    return verify(
        proof.roots, proof.final_pol, openings, steps=STEPS, arity=ARITY,
        transcript=replay, pow_bits=POW_BITS, nonce=nonce, n_bits=LOG_N,
    )


_, f_n = fibonacci_trace(A0, B0, N)

print(f"proved the ({A0}, {B0}) Fibonacci sequence over {N} rows")
print(f"F_{N} = {f_n}")
print()
print("verifier accepts the honest trace:  ", prove_fibonacci(f_n))
print("verifier accepts one corrupted row: ", prove_fibonacci(f_n, corrupt=N // 2))
print()
print("The rejection is the degree check: relax the bound to LOG_N + LOG_BLOWUP")
print("and the corrupted proof passes, because every OTHER check already does.")
print()
print("Not yet a sound proof -- the DEEP stage that binds this FRI instance to")
print("the committed trace needs a proving key. N_QUERIES=4 is a demo figure")
print("too; soundness comes from the query count and pil2 opens ~64.")
