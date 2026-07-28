# An SP1 shard, proven and verified. sp1-zorch is SP1's prover rebuilt on zorch
# blocks: `ShardProver` runs SP1's four stages over one Fiat-Shamir transcript —
# trace commitment, LogUp-GKR over the lookup buses, ZeroCheck of the per-row AIR
# constraints, jagged-PCS opening — and `ShardVerifier` is its stage-for-stage
# dual. The statement is a `ShardClaim` (vk, public values, chip row counts); the
# trace is the `ShardWitness` it never names.
#
# A prover's input is a TRACE, not an ELF, so the guest is a tiny SP1-style chip:
# two columns, `a` pinned to 1 on real rows (the AIR constraint (a-1)·(b-1) = 0),
# on the lookup bus via one `rw_constraints` Interaction — SP1's stand-in for
# cross-row constraints. Change HEIGHT or the seed and re-run.
import frx.numpy as fnp
import numpy as np
from rw_constraints import Interaction, VirtualPairCol
from zk_dtypes import koalabear_mont as F

from zorch.commit.smcs import SingleMatrixCommitmentScheme
from zorch.hash.compression import Compression, CompressionParams
from zorch.hash.poseidon2.poseidon2 import Poseidon2
from zorch.hash.sponge import Sponge, SpongeParams
from zorch.pcs.jagged.region import JaggedRegion
from zorch.testkit.transcript import cheap_transcript

from sp1_zorch.logup_gkr.circuit import GkrChip
from sp1_zorch.poseidon2.koalabear16 import koalabear16_params
from sp1_zorch.shard_prover.prove_shard import ShardProver
from sp1_zorch.shard_prover.verify_shard import ShardVerifier
from sp1_zorch.types import (
    ChipMetadata,
    ChipWidths,
    MachineVerifyingKey,
    ShardClaim,
    ShardWitness,
)

HEIGHT, WIDTH = 4, 2       # a 4-row, 2-column chip
MAX_LOG_ROWS = 5           # the machine's max chip height, 2^5
LOG_STACK = 3             # jagged stacking height (chip area is a multiple of it)


class WitnessChip:
    """One per-row AIR constraint: column a is 1 on every real row, so
    (a - 1)·(b - 1) vanishes there — the SP1 zerocheck's per-row form."""

    def eval_constraints(self, trace, public_values):
        a, b = trace[:, 0], trace[:, 1]
        one = fnp.ones((), trace.dtype)
        return fnp.stack([(a - one) * (b - one)], axis=-1)


def rand(seed, shape):
    return fnp.array(np.random.default_rng(seed).integers(1, 1 << 30, shape, np.int64), dtype=F)


# Trace: column 0 all-ones (satisfies the constraint), column 1 the witness.
trace = fnp.concatenate([fnp.ones((HEIGHT, 1), F), rand(1, (HEIGHT, 1))], axis=1)
main_region = JaggedRegion.from_chips(
    [trace], log_stacking_height=LOG_STACK, max_log_row_count=MAX_LOG_ROWS,
    chip_names=("alpha",))
public_values = rand(30, (8,))
vk = MachineVerifyingKey(
    preprocessed_commit=rand(31, (8,)), pc_start=rand(32, (3,)),
    cum_sum_x=rand(33, (7,)), cum_sum_y=rand(34, (7,)), enable_untrusted=0)

# One lookup interaction: send column 1 on the bus with multiplicity from column 0.
gkr_chips = (
    GkrChip("alpha", (Interaction(
        values=(VirtualPairCol.single_main(1),),
        multiplicity=VirtualPairCol.single_main(0),
        kind=3, is_send=True),)),
)
perm = Poseidon2(koalabear16_params())
smcs = SingleMatrixCommitmentScheme(
    Sponge(perm, SpongeParams(rate=8, out=8)),
    Compression(perm, CompressionParams(arity=2, chunk=8)))
chips = {"alpha": WitnessChip()}

# Row counts change shard to shard, so they ride the claim; column counts are
# fixed by the AIR, so they configure the role.
shared = dict(smcs=smcs, log_blowup=1, gkr_chips=gkr_chips, chips=chips, num_betas=3,
              num_row_variables=MAX_LOG_ROWS - 1, max_log_row_count=MAX_LOG_ROWS)
claim = ShardClaim(vk, public_values, ChipMetadata(("alpha",), (HEIGHT,)))
witness = ShardWitness(main_region, None)

# Each stage's reduced claim is the next stage's source claim; the four
# reductions land on the trivial claim and their messages are the proof.
proof = ShardProver(open_num_queries=2, **shared).prove(
    claim, witness, cheap_transcript(F)).reduction_proof

# One dual per prover stage, in the prover's order, ANDing each ok.
# `verify_public_values=False`: that leg balances the GKR cumulative sum against
# the digest of a real 187-element SP1 public-values vector, which the 8 random
# values above are not. Every real shard runs it.
verifier = ShardVerifier(
    chip_names=("alpha",), chip_widths={"alpha": ChipWidths(WIDTH)},
    log_stacking_height=LOG_STACK, open_num_queries=2, verify_public_values=False,
    **shared)


def accepts(claimed_public_values):
    try:
        restated = ShardClaim(vk, claimed_public_values, claim.chip_metadata)
        return bool(verifier.verify(restated, proof, cheap_transcript(F)).ok)
    except Exception:
        return False


print(f"proved a {HEIGHT}-row SP1 shard (1 chip, 1 lookup interaction) over KoalaBear")
print("verifier accepts the shard proof: ", accepts(public_values))
print("... and rejects a wrong statement:", not accepts(rand(99, (8,))))
