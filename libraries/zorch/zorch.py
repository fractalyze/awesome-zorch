# Sumcheck — the workhorse interactive proof behind modern SNARKs: it convinces
# a verifier of  sum over x in {0,1}^n  of  a(x)·b(x)  — the whole 2^n-entry
# hypercube — in O(n) verifier work. A round here is not a black box: it is just
# a *summand*. Define one, hand it to `prove` (one scan over the n variables,
# one fused GPU region), and `verify` replays it. Fiat-Shamir over a real
# poseidon2 (koalabear-16) transcript. Change LOG_N (10..24) and re-run.
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
    """A product sumcheck round, in full: a `degree` plus a `combine` that fuses
    the factors at a point. The driver asks for nothing else. Swap `combine` for
    another summand (zerocheck, LogUp) and the same `prove` scans it. This is
    `zorch.sumcheck.prover.SumcheckRound`, spelled out."""

    degree: int

    def combine_scalars(self):
        return ()  # product carries no loop-invariant scalars (LogUp's λ would)

    def combine(self, scalars, *factors):
        del scalars
        return reduce(operator.mul, factors)


def transcript():
    return DuplexTranscript.new(koalabear16_perm(), rate=8)


a = rand_field(1, (1 << LOG_N,), F)
b = rand_field(2, (1 << LOG_N,), F)
claimed = fnp.sum(a * b)

# msgs.round_poly is the proof; msgs.challenge is the evaluation point.
_, _, msgs = prove(Product(degree=DEGREE), [a, b], transcript())
proof = msgs.round_poly

# The verifier round is summand-agnostic — it checks only the round-poly
# identity, so it pairs with any prover summand at this degree.
point, final_claim, _, ok = verify(
    verifier.SumcheckRound(DEGREE), claimed, proof, transcript()
)
print("verifier accepts:", bool(ok))
print(f"proof: {proof.shape[0]} rounds x degree-{proof.shape[1] - 1} polynomials")
print(f"claimed sum: {int(claimed)}")
