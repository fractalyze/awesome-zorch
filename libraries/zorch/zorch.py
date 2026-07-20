# Sumcheck — the workhorse interactive proof behind modern SNARKs: it convinces
# a verifier of  sum over x in {0,1}^n  of  a(x)·b(x)  — the whole 2^n-entry
# hypercube — in O(n) verifier work. A round here is not a black box: the custom
# part is just a *summand*. Define one, wrap it in `StandardRound`, and
# `fold_rounds` binds it one variable at a time; `verify` replays the transcript.
# Fiat-Shamir over a real poseidon2 (koalabear-16) transcript. Change LOG_N
# (10..24) and re-run.
import operator
from dataclasses import dataclass
from functools import reduce

import frx.numpy as fnp
from zk_dtypes import koalabear_mont as F

from zorch.hash.poseidon2.testing.koalabear16 import koalabear16_perm
from zorch.prove import fold_rounds
from zorch.sumcheck import prover, verifier
from zorch.testkit.random_field import rand_field
from zorch.transcript import DuplexTranscript
from zorch.verify import verify

LOG_N = 20  # 2^20 = 1,048,576 evaluations
DEGREE = 2  # round polys are degree-2: the product a·b of two multilinears


@dataclass(frozen=True)
class Product:
    """A product summand `s = sum_x prod_k P_k(x)` — the whole custom part of a
    sumcheck round: a `degree` plus a `combine` that fuses the factors at a point.
    `StandardRound` supplies the split/fold/Fiat-Shamir machinery around it. Swap
    `combine` for another summand (zerocheck, LogUp) and the same round drives it.
    This is `prover.ProductSummand`, spelled out."""

    degree: int

    def combine_scalars(self):
        return ()  # product carries no loop-invariant scalars (LogUp's λ would)

    def combine(self, scalars, *factors):
        del scalars
        return reduce(operator.mul, factors)

    def _combine(self, *factors):
        return self.combine(self.combine_scalars(), *factors)


def transcript():
    return DuplexTranscript.new(koalabear16_perm(), rate=8)


a = rand_field(1, (1 << LOG_N,), F)
b = rand_field(2, (1 << LOG_N,), F)
claimed = fnp.sum(a * b)

# Bind the round over every variable; stack the round polys into the proof.
round = prover.StandardRound(Product(degree=DEGREE))
state = fnp.stack([a, b])
_, _, msgs = fold_rounds(round, state, transcript(), LOG_N)
proof = fnp.stack(msgs)

# The verifier round is summand-agnostic — it checks only the round-poly
# identity, so it pairs with any prover summand at this degree.
point, final_claim, _, ok = verify(
    verifier.SumcheckRound(DEGREE), claimed, proof, transcript()
)
print("verifier accepts:", bool(ok))
print(f"proof: {proof.shape[0]} rounds x degree-{proof.shape[1] - 1} polynomials")
print(f"claimed sum: {int(claimed)}")
