# Fibonacci through SWIRL: prove it, then check the proof.
#
# openvm-zorch is OpenVM's prover rebuilt on zorch blocks. prove() composes
# SWIRL's five stages over ONE Fiat-Shamir transcript -- a stacked commitment,
# LogUp-GKR over any interaction buses, a batched ZeroCheck with univariate
# skip, a stacked opening reduction, and a WHIR opening -- and verify() is its
# stage-for-stage dual. Both run below, on the AIR this file builds.
#
# A prover's input here is a TRACE, not an ELF. Compiling a guest program and
# executing it into columns is the openvm SDK's job; openvm-zorch starts where
# the trace does, which is where all five stages and every GPU win live.
#
# So the guest is the AIR itself -- openvm's Fibonacci. Two columns (a, b),
# row i = (F_i, F_{i+1}); the public values are the seed (a0, b0) and the
# claimed F_n. Change the seed A0, B0 or the height LOG_HEIGHT below and re-run
# -- it proves whatever sequence you pick. The default (0, 1) over 64 rows is
# byte-identical to openvm-stark-backend v2.0.0's fixture, whose constraints
# and trace this repo byte-matches.
import frx.numpy as fnp
from zk_dtypes import babybear_mont as F

from openvm_zorch.logup_zerocheck.constraints import ConstraintsDag
from openvm_zorch.poly_common import VerificationError
from openvm_zorch.poseidon2.babybear16 import babybear16_hasher
from openvm_zorch.prove import AirInstance, SystemParams, prove
from openvm_zorch.transcript import new_transcript
from openvm_zorch.verify import AirVk, verify
from openvm_zorch.whir.prover import WhirConfig

A0, B0 = 0, 1   # the seed row (F_0, F_1)
LOG_HEIGHT = 6  # 2^6 = 64 rows, so the claim is F_64


def fibonacci_trace(a0: int, b0: int, log_height: int):
    """The witness: row i = (F_i, F_{i+1}) from the seed (a0, b0), plus the
    final F_n as a field element. The columns are BabyBear, so each add reduces
    mod the field on its own -- no explicit modulus."""
    rows = [(fnp.full((), a0, F), fnp.full((), b0, F))]
    for _ in range((1 << log_height) - 1):
        a_i, b_i = rows[-1]
        rows.append((b_i, a_i + b_i))
    return fnp.array(rows, dtype=F), rows[-1][1]


trace, f_n = fibonacci_trace(A0, B0, LOG_HEIGHT)
public_values = (A0, B0, int(f_n))  # a0, b0, the claimed F_n

# The AIR, as the symbolic node DAG keygen hands the prover: nodes in
# topological order, and the indices of the nodes asserted to be zero.
nodes: list[dict] = []


def node(**kw) -> int:
    nodes.append(kw)
    return len(nodes) - 1


def main(index: int, offset: int) -> int:
    """Column `index` of this row (offset 0) or the next one (offset 1)."""
    return node(kind="variable", entry="main", part_index=0, index=index, offset=offset)


def public(index: int) -> int:
    return node(kind="variable", entry="public", part_index=None, index=index, offset=None)


def add(left: int, right: int) -> int:
    return node(kind="add", left=left, right=right)


def sub(left: int, right: int) -> int:
    return node(kind="sub", left=left, right=right)


def mul(left: int, right: int) -> int:
    return node(kind="mul", left=left, right=right)


first, trans, last = (
    node(kind="is_first_row"),
    node(kind="is_transition"),
    node(kind="is_last_row"),
)
a, b = main(0, 0), main(1, 0)
a_next, b_next = main(0, 1), main(1, 1)
a0, b0, claimed = public(0), public(1), public(2)

# Each row asserts `selector * expr == 0`, which is what pins the trace to the
# public values at both ends and to the recurrence in between.
constraint_idx = (
    mul(first, sub(a, a0)),               # the trace starts at the given input,
    mul(first, sub(b, b0)),               # both columns
    mul(trans, sub(b, a_next)),           # a' = b
    mul(trans, sub(add(a, b), b_next)),   # b' = a + b
    mul(last, sub(b, claimed)),           # and it ends at the claimed F_n
)

# Fibonacci is a pure constraint AIR: no LogUp interactions, no bus. With
# nothing to fold, the LogUp-GKR stage folds an empty input layer -- exactly
# what the reference does for any AIR that declares no interactions -- so the
# proof's weight rides the ZeroCheck over the five constraints above and the
# WHIR opening that pins them to the committed trace.
dag = ConstraintsDag(
    nodes=tuple(nodes), constraint_idx=constraint_idx, interactions=()
)

# Production-shaped params, as the reference fixture pins them.
params = SystemParams(
    l_skip=4,
    n_stack=8,
    log_blowup=1,
    logup_pow_bits=2,
    max_constraint_degree=3,
    whir=WhirConfig(
        k=4,
        num_queries=[10, 3, 2],
        mu_pow_bits=3,
        folding_pow_bits=2,
        query_phase_pow_bits=1,
    ),
)

sponge, comp = babybear16_hasher()
vk_pre_hash = (0,) * 8

_, proof = prove(
    new_transcript(),
    sponge,
    comp,
    params,
    vk_pre_hash,
    [
        AirInstance(
            trace=trace,
            dag=dag,
            public_values=public_values,
            constraint_degree=2,
            needs_next=True,
            is_required=True,
        )
    ],
)


def accepts(claim: tuple[int, int, int]) -> bool:
    """Verify against a claim, from the AIR's shape alone -- no trace. The
    public values are absorbed into the transcript before anything is sampled,
    so a changed claim re-derives different challenges and the proof stops
    answering the questions it was built for."""
    vk = AirVk(
        dag=dag,
        log_height=LOG_HEIGHT,
        width=2,
        public_values=claim,
        constraint_degree=2,
        needs_next=True,
        is_required=True,
    )
    try:
        verify(
            new_transcript(),
            sponge,
            comp,
            params,
            vk_pre_hash,
            [vk],
            proof.common_main_commit,
            proof,
        )
        return True
    except VerificationError:
        return False


# A wrong claim: F_n + 1 in the field, so it stays a valid element even when
# F_n is P-1 (a plain int F_n + 1 would be P, which has no field element and
# fails to construct).
lied_about = public_values[:2] + (int(f_n + fnp.ones((), F)),)
n = 1 << LOG_HEIGHT
print(f"proved the ({A0}, {B0}) Fibonacci sequence: F_{n} = {public_values[2]} over {n} rows")
print("verifier accepts the proof:      ", accepts(public_values))
print("verifier accepts a wrong F_n:    ", accepts(lied_about))
