# Sumcheck — the workhorse interactive proof behind modern SNARKs.
#
# The prover convinces a verifier of the value of  sum over x in {0,1}^n  of
# a(x)·b(x)  — the whole 2^n-entry hypercube — while the verifier does only
# O(n) work. `prove` is one scan over the n variables, so the entire prover
# compiles to a single fused GPU region; `verify` is its stage-for-stage dual.
# Fiat-Shamir runs over a real poseidon2 (koalabear-16) transcript. Everything
# here is plain zorch; change LOG_N (10..24) or the seeds and re-run.
import frx.numpy as fnp
from zk_dtypes import koalabear_mont as F

from zorch.hash.poseidon2.testing.koalabear16 import koalabear16_perm
from zorch.sumcheck import prover, verifier
from zorch.sumcheck.prover import prove
from zorch.testkit.random_field import rand_field
from zorch.transcript import DuplexTranscript
from zorch.verify import verify

LOG_N = 20  # 2^20 = 1,048,576 evaluations
DEGREE = 2  # round polys are degree-2: the product a·b of two multilinears


def transcript():
    return DuplexTranscript.new(koalabear16_perm(), rate=8)


a = rand_field(1, (1 << LOG_N,), F)
b = rand_field(2, (1 << LOG_N,), F)
claimed = fnp.sum(a * b)

# Prover: hand the round its factors and scan the hypercube. `round_poly` is the
# proof, `challenge` is the point the sponge drew — both fall straight out.
_, _, msgs = prove(prover.SumcheckRound(degree=DEGREE), [a, b], transcript())
proof = msgs.round_poly

# Verifier: the same round on the other side, replayed against the same sponge.
point, final_claim, _, ok = verify(
    verifier.SumcheckRound(DEGREE), claimed, proof, transcript()
)
print("verifier accepts:", bool(ok))
print(f"proof: {proof.shape[0]} rounds x degree-{proof.shape[1] - 1} polynomials")
print(f"claimed sum: {int(claimed)}")
