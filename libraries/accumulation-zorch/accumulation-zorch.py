# R1CS-NARK: prove, then the deferred decide — accumulation's two halves.
#
# nark.prove_no_zk is arkworks' R1CSNark::prove as ONE fused @frx.jit trace: the
# sparse M·z reduce and all three Pedersen commitments run on-device, and that
# same trace is what the GPU export lowers to a single PJRT call. The proof it
# returns is byte-identical to the arkworks prover's.
#
# Accumulation is light by design — a step folds a proof into an accumulator and
# *defers* verification. The deferred check is the decider: over
# z = r1cs_input ‖ blinded_witness it recomputes comm_{a,b,c} = commit(M·z) and
# accepts iff they equal what the proof published. Per the repo's benchmark that
# check is its largest GPU win — at n = 262 144 the CPU's six sequential
# variable-base MSMs take 6 300 ms, the fused core 54 ms.
#
# Everything here is plain accumulation-zorch; change N (or PALLAS -> VESTA) and re-run.
import numpy as np
import zk_dtypes as zk

from accumulation_zorch import curve, nark
from accumulation_zorch.curve import PALLAS as cv
from accumulation_zorch.r1cs_nark_as import Accumulator, decide

N = 16  # constraints, and so the size of each commitment MSM

# A committer key: distinct multiples of the Pasta generator.
ec = zk.ecinfo(cv.g1)
G = cv.g1((ec.gx, ec.gy))
generators = [np.asarray(G * cv.fr(i + 1), dtype=cv.g1) for i in range(N)]

# A squaring chain as R1CS: z[i] * z[i] = z[i+1]. Sparse rows of (coeff,
# var_index) — the arkworks Matrix<Fr> layout.
a = [[(1, i)] for i in range(N)]
b = [[(1, i)] for i in range(N)]
c = [[(1, i + 1)] for i in range(N)]

# fr elements, not python ints: cv.fr reduces mod r, so ** needs no modulus.
z = [cv.fr(5)]
for _ in range(N):
    z.append(z[-1] ** 2)
r1cs_input, blinded_witness = z[:1], z[1:]

# Prove: one fused trace, serialized as arkworks CanonicalSerialize —
# comm_a ‖ comm_b ‖ comm_c (compressed, 33B each), then the blinded witness.
proof = nark.prove_no_zk(cv, a, b, c, r1cs_input, blinded_witness, generators)
published = proof[:99]


def decider_accepts(witness):
    """ASForR1CSNark::decide, re-deriving the proof's commitments from the witness.
    The accumulator's HP vectors coincide with A·z / B·z on the no-zk path; its
    test_comm_{1,2,3} are the hp_as check, so the three the proof carries are what
    a bare NARK proof pins down. sigmas/hp_rand are the zk randomizers — None here
    makes the commitments non-hiding."""
    acc = Accumulator(r1cs_input, witness, z[:N], z[:N], sigmas=None, hp_rand=None)
    comm_a, comm_b, comm_c = decide(cv, a, b, c, generators, None, acc)[:3]
    return published == b"".join(
        curve.point_to_bytes(cv, p) for p in (comm_a, comm_b, comm_c))


tampered = [blinded_witness[0] + cv.fr(1)] + blinded_witness[1:]
print(f"proof: {len(proof)} bytes over {N} constraints, from one fused trace")
print("decider accepts the proof:          ", decider_accepts(blinded_witness))
print("decider accepts a tampered witness: ", decider_accepts(tampered))
