# Sumcheck — the workhorse interactive proof behind modern SNARKs.
#
# The prover convinces a verifier of the value of  sum over x in {0,1}^n  of
# a(x)·b(x)  — the whole 2^n-entry hypercube — while the verifier does only
# O(n) work. Fiat-Shamir runs over a real poseidon2 (koalabear-16) transcript.
# Everything here is plain zorch; change LOG_N (10..24) or the seeds and re-run.
import jax.numpy as jnp
from zk_dtypes import koalabear_mont as F

from zorch.hash.poseidon2.testing.koalabear16 import koalabear16_perm
from zorch.prove import fold_rounds
from zorch.sumcheck import prover, verifier
from zorch.testkit.random_field import rand_field
from zorch.transcript import DuplexTranscript
from zorch.verify import verify

LOG_N = 20  # 2^20 = 1,048,576 evaluations


def transcript():
    return DuplexTranscript.new(koalabear16_perm(), rate=8)


a = rand_field(1, (1 << LOG_N,), F)
b = rand_field(2, (1 << LOG_N,), F)
claimed = jnp.sum(a * b)

state = jnp.stack([a, b])
_, _, msgs = fold_rounds(
    prover.StandardRound(prover.ProductSummand(2)), state, transcript(), LOG_N
)
proof = jnp.stack(msgs)

point, final_claim, _, ok = verify(
    verifier.SumcheckRound(2), claimed, proof, transcript()
)
print("verifier accepts:", bool(ok))
print(f"proof: {proof.shape[0]} rounds x degree-{proof.shape[1] - 1} polynomials")
print(f"claimed sum: {int(claimed)}")
