# Sumcheck — the workhorse interactive proof behind modern SNARKs.
#
# The prover convinces a verifier of the value of  sum over x in {0,1}^n  of
# a(x)·b(x)  — the whole 2^n-entry hypercube — while the verifier does only
# O(n) work. A sumcheck round is not a black box: it is just a *summand*. Define
# one below and hand it to `prove`, which owns the mechanics — split each MLE on
# the current variable, lift to the round's domain, run Fiat-Shamir, fold at the
# challenge — as one scan over the n variables that compiles to a single fused
# GPU region. `verify` is its stage-for-stage dual. Fiat-Shamir runs over a real
# poseidon2 (koalabear-16) transcript. Everything here is plain zorch; change
# LOG_N (10..24) or the seeds and re-run.
import operator
from dataclasses import dataclass
from functools import reduce

import frx.numpy as fnp
from zk_dtypes import koalabear_mont as F

from zorch.hash.poseidon2.testing.koalabear16 import koalabear16_perm
from zorch.round import Round
from zorch.sumcheck import verifier
from zorch.sumcheck.prover import prove
from zorch.testkit.random_field import rand_field
from zorch.transcript import DuplexTranscript
from zorch.verify import verify

LOG_N = 20  # 2^20 = 1,048,576 evaluations
DEGREE = 2  # round polys are degree-2: the product a·b of two multilinears


@dataclass(frozen=True)
class Product(Round):
    """The summand `s = sum_x prod_k P_k(x)` — the whole definition of a product
    sumcheck round. All the driver asks for is the round-poly `degree` and a
    `combine` that fuses the factors at a point; here that fusion is a product.
    (This is `zorch.sumcheck.prover.SumcheckRound`, written out.) Swap the body
    for another summand — an eq-weighted zerocheck, a LogUp combine — and the
    same `prove` scans it, unchanged."""

    degree: int

    def combine_scalars(self):
        return ()  # no loop-invariant scalars; the product reads only its factors

    def combine(self, scalars, *factors):
        del scalars  # product has none
        return reduce(operator.mul, factors)


def transcript():
    return DuplexTranscript.new(koalabear16_perm(), rate=8)


a = rand_field(1, (1 << LOG_N,), F)
b = rand_field(2, (1 << LOG_N,), F)
claimed = fnp.sum(a * b)

# Prover: hand the round its factors and scan the hypercube. `round_poly` is the
# proof, `challenge` is the point the sponge drew — both fall straight out.
_, _, msgs = prove(Product(degree=DEGREE), [a, b], transcript())
proof = msgs.round_poly

# Verifier: summand-agnostic — it checks only the round-poly identity, so one
# `SumcheckRound` at this degree pairs with any prover summand above.
point, final_claim, _, ok = verify(
    verifier.SumcheckRound(DEGREE), claimed, proof, transcript()
)
print("verifier accepts:", bool(ok))
print(f"proof: {proof.shape[0]} rounds x degree-{proof.shape[1] - 1} polynomials")
print(f"claimed sum: {int(claimed)}")
