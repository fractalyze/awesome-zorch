# R1CS-NARK accumulation: accumulate one proof, fold more in, decide once.
#
# Accumulation's whole promise is deferral. A NARK proof commits to A·z, B·z, C·z
# with three size-n MSMs; checking k proofs the naive way costs 3k of them. An
# accumulation scheme instead FOLDS each new proof into a running accumulator with
# only in-circuit work — no size-n MSM — and pays the six-MSM decider exactly
# once, at the very end. So k proofs cost one decide, not k.
#
# The statement, per proof: "I know a secret seed w_0 whose chain w <- (w + 5)*w
# lands on the public `out` after N steps." R1CS writes that as three matrices
# over z = public ‖ witness, each row asserting (A·z)_i * (B·z)_i = (C·z)_i.
#
# The Fiat-Shamir challenges that bind each fold come from the SAME instantiated
# Poseidon the prover uses everywhere here — arkworks' PoseidonSponge<Fq>, shipped
# in-package (sponge.default_params), so nothing below needs a fixture.
#
# Everything is plain accumulation-zorch; change N (or PALLAS -> VESTA) and re-run.
import numpy as np

from accumulation_zorch import curve, r1cs_nark_as, sponge
from accumulation_zorch.curve import PALLAS as cv

N = 16  # chain steps = R1CS rows = the size of each commitment MSM

# A committer key: one base per row, plus a hiding base for the zk blinders. The
# g1 dtype reads an integer k as k·G, so this is [1·G .. (N+1)·G] — enough to
# exercise the commitments, but deliberately NOT a sound Pedersen key: these bases
# have known discrete-log relations (G_i = i·G), which is exactly what binding
# forbids. A real key comes from a setup with unknown relations.
bases = list(np.arange(1, N + 2, dtype=cv.g1))
generators, hiding = bases[:N], bases[N]

# z = [1, out] ‖ [w_0 .. w_{N-1}]: wire 0 is the constant 1, wire 1 the public
# output, the rest the secret chain. A adds 5·1 to w_i and B selects w_i, so the
# Hadamard product is (w_i + 5)·w_i; C names the next wire, and the last row names
# `out`, pinning the chain to the public value.
W = 2
a = [[(1, W + i), (5, 0)] for i in range(N)]
b = [[(1, W + i)] for i in range(N)]
c = [[(1, W + i + 1)] for i in range(N - 1)] + [[(1, 1)]]

# fr elements reduce mod r, so no explicit modulus; the prover canonicalizes them.
witness = [cv.fr(3)]
for _ in range(N - 1):
    witness.append((witness[-1] + cv.fr(5)) * witness[-1])
public = [cv.fr(1), (witness[-1] + cv.fr(5)) * witness[-1]]

params = sponge.default_params(cv)   # the in-package ark-sponge Poseidon
rng = np.random.default_rng(0)


def prove_step(acc=None):
    """Accumulate the statement, or fold it into `acc`, on fresh randomness."""
    rnd = r1cs_nark_as.sample_randomness(cv, rng, len(witness))
    args = (cv, a, b, c, public, witness, generators, hiding, params, N)
    if acc is None:
        return r1cs_nark_as.accumulate(*args, rnd)[0]
    return r1cs_nark_as.fold(*args, acc, rnd)[0]


def decider_accepts(acc):
    """ASForR1CSNark::decide — re-derive the six commitments from the
    accumulator's witness and check they equal the ones it carries. This is the
    whole deferred cost, paid once no matter how many proofs were folded in."""
    got = r1cs_nark_as.decide(cv, a, b, c, generators, hiding, acc.to_decide())
    return all(curve.point_to_bytes(cv, g) == curve.point_to_bytes(cv, s)
               for g, s in zip(got, acc.comms))


acc = prove_step()          # accumulate proof #1
for _ in range(3):          # fold proofs #2..#4 in — each is only in-circuit work
    acc = prove_step(acc)

forged = acc.blinded_witness.copy()
forged[0] = forged[0] + cv.fr(1)
tampered = acc._replace(blinded_witness=forged)
print(f"accumulator after 1 accumulate + 3 folds, {N} constraints each")
print("decider accepts the accumulator:       ", decider_accepts(acc))
print("decider accepts a tampered accumulator:", decider_accepts(tampered))
