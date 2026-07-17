# R1CS-NARK: prove, then the deferred decide — accumulation's two halves.
#
# The statement: "I know a secret seed w_0 whose chain w <- (w + 5) * w lands on
# the public `out` after N steps." R1CS writes that as three matrices over
# z = public ‖ witness, each row asserting (A·z)_i * (B·z)_i = (C·z)_i.
#
# nark.prove_no_zk is arkworks' R1CSNark::prove as ONE fused @frx.jit trace: the
# sparse M·z reduce and the three Pedersen commitments to A·z, B·z, C·z all run
# on-device, and that same trace is what the GPU export lowers to a single PJRT
# call. The proof it returns is byte-identical to the arkworks prover's.
#
# Committing to A·z, B·z, C·z is what *defers* the work: accumulation folds those
# commitments forward cheaply and checks them once, at the end — the decider,
# which re-derives them from the witness. Per the repo's benchmark that check is
# its largest GPU win: at n = 262 144 the CPU's six sequential variable-base MSMs
# take 6 300 ms, the fused core 54 ms.
#
# Everything here is plain accumulation-zorch; change N (or PALLAS -> VESTA) and re-run.
import numpy as np

from accumulation_zorch import curve, nark
from accumulation_zorch.curve import PALLAS as cv
from accumulation_zorch.r1cs_nark_as import Accumulator, decide

N = 16  # chain steps = R1CS rows = the size of each commitment MSM

# A committer key, one base per row: the g1 dtype reads an integer k as k·G, so
# this is [1·G .. N·G]. Enough to exercise the commitments, but deliberately NOT a
# sound Pedersen key — these bases have known discrete-log relations (G_i = i·G),
# which is exactly what binding forbids. A real key comes from a setup with
# unknown relations; the port takes arkworks' committer key from its fixtures.
generators = np.arange(1, N + 1, dtype=cv.g1)

# z = [1, out] ‖ [w_0 .. w_{N-1}]: wire 0 is the constant 1 (so a row can add a
# constant), wire 1 the public output, the rest the secret chain. Rows are sparse
# (coeff, wire) pairs — the arkworks Matrix<Fr> layout. A adds 5·1 to w_i and B
# selects w_i, so the Hadamard product is (w_i + 5)·w_i; C names the next wire,
# and the final row names `out` instead, pinning the chain to the public value.
W = 2
a = [[(1, W + i), (5, 0)] for i in range(N)]
b = [[(1, W + i)] for i in range(N)]
c = [[(1, W + i + 1)] for i in range(N - 1)] + [[(1, 1)]]

# fr elements, not python ints: cv.fr reduces mod r, so no explicit modulus.
witness = [cv.fr(3)]
for _ in range(N - 1):
    witness.append((witness[-1] + cv.fr(5)) * witness[-1])
public = [cv.fr(1), (witness[-1] + cv.fr(5)) * witness[-1]]

# Prove: one fused trace, serialized as arkworks CanonicalSerialize —
# comm_a ‖ comm_b ‖ comm_c (compressed, 33B each), then the witness.
proof = nark.prove_no_zk(cv, a, b, c, public, witness, generators)
published = proof[:99]


def decider_accepts(witness):
    """ASForR1CSNark::decide, re-deriving the proof's commitments from the witness.
    The HP vectors are A·z / B·z, which is what they collapse to on the no-zk path;
    the accumulator's test_comm_{1,2,3} over them are the hp_as check that a_vec ∘
    b_vec = C·z, so the three commitments the proof carries are what a bare NARK
    proof pins down. The field is named blinded_witness because the zk path puts
    witness + gamma·r there; no-zk hands it the raw witness. sigmas/hp_rand are the
    zk randomizers — None ⇒ non-hiding."""
    hp_a = nark.matrix_vec_mul(cv, a, public, witness)
    hp_b = nark.matrix_vec_mul(cv, b, public, witness)
    acc = Accumulator(public, witness, hp_a, hp_b, sigmas=None, hp_rand=None)
    comm_a, comm_b, comm_c = decide(cv, a, b, c, generators, None, acc)[:3]
    return published == b"".join(
        curve.point_to_bytes(cv, p) for p in (comm_a, comm_b, comm_c))


tampered = [witness[0] + cv.fr(1)] + witness[1:]
print(f"proof: {len(proof)} bytes over {N} constraints, from one fused trace")
print("decider accepts the proof:          ", decider_accepts(witness))
print("decider accepts a tampered witness: ", decider_accepts(tampered))
