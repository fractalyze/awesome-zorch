# An SP1 shard, proven and verified. sp1-zorch is SP1's prover rebuilt on zorch
# blocks: `prove_shard_chain` runs SP1's four stages over one Fiat-Shamir
# transcript — a stacked trace commitment, LogUp-GKR over the chips' lookup buses,
# a ZeroCheck of the per-row AIR constraints, and a jagged-PCS opening — and
# `verify_shard_chain` is its stage-for-stage dual. Both run below.
#
# A prover's input is a TRACE, not an ELF. So the guest is a tiny SP1-style chip
# built in Python: two columns, column `a` pinned to 1 on every real row (the AIR
# constraint (a-1)·(b-1) = 0), joined to the machine's lookup bus by one
# `rw_constraints` Interaction — the send/receive argument SP1 uses in place of
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
from sp1_zorch.shard_prover.prove_shard import (
    ShardBridge,
    preamble_chip_metadata,
    prove_shard_chain,
)
from sp1_zorch.shard_prover.types import ChipShape, MachineVerifyingKey, TraceShape
from sp1_zorch.shard_prover.verify_shard import ShardVerifierBridge, verify_shard_chain

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
metadata = preamble_chip_metadata(("alpha",), [HEIGHT], dtype=F)

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

shared = dict(smcs=smcs, log_blowup=1, vk=vk, chip_metadata=metadata, gkr_chips=gkr_chips,
              chips=chips, num_betas=3, num_row_variables=MAX_LOG_ROWS - 1,
              max_log_row_count=MAX_LOG_ROWS)

# Prove: the ProveChain threads the bridge + transcript through its four stages
# and returns their messages — the proof.
_, _, proof = prove_shard_chain(open_num_queries=2, **shared)(
    ShardBridge(main_region, None, public_values), cheap_transcript(F))

# Verify: the dual chain replays every stage against the proof, ANDing each ok.
dual = verify_shard_chain(
    chip_names=("alpha",), chip_shapes={"alpha": ChipShape(TraceShape(HEIGHT, WIDTH))},
    log_stacking_height=LOG_STACK, open_num_queries=2, verify_public_values=False, **shared)


def accepts(claimed_public_values):
    try:
        _, _, ok = dual(ShardVerifierBridge(claimed_public_values), proof, cheap_transcript(F))
        return bool(ok)
    except Exception:
        return False


print(f"proved a {HEIGHT}-row SP1 shard (1 chip, 1 lookup interaction) over KoalaBear")
print("verifier accepts:          ", accepts(public_values))
print("verifier accepts wrong pv: ", accepts(rand(99, (8,))))  # different statement → reject
