# ZisK's low-degree test: commit a trace, prove the codeword is low-degree,
# then try to fool the verifier.
#
# zisk-zorch is ZisK's pil2-stark prover rebuilt on zorch blocks. A pil2 proof
# runs five stages over one Fiat-Shamir transcript -- trace commit, LogUp
# grand-sum, quotient, DEEP-ALI composition, and the FRI low-degree test. The
# two ends of that chain are self-contained, so they are what runs below: the
# stage-1 commit that is byte-matched against a real pil2-proofman CUDA dump,
# and the FRI fold/query loop that closes every pil2 proof. The stages between
# need an AIR's starkinfo fixture -- a proving key, not something a snippet can
# build -- so they sit this one out.
#
# What FRI actually settles: the prover claims a committed codeword is the
# evaluation of a polynomial of degree < 2^LOG_N. It folds that codeword down a
# layer chain, committing each layer, and opens a few positions per layer. The
# verifier replays the same transcript, re-derives the query positions itself,
# and checks every fold lands where it should. Tamper with any of it and a
# check fails -- the last lines below do exactly that.
#
# Everything is editable. LOG_N sets the degree bound, LOG_BLOWUP the rate;
# together they fix the extended domain the prover works over. LOG_N 10..18 all
# finish inside the box's wall clock -- the trace size is the cheap dimension
# here, so raising it costs far less than raising N_QUERIES.
import frx.numpy as fnp
import numpy as np
from zk_dtypes import goldilocks as F
from zk_dtypes import goldilocksx3 as F3

from zisk_zorch.commit.trace_commit import commit_trace, extend
from zisk_zorch.fri.prover import prove, prove_queries
from zisk_zorch.fri.queries import sample_query_positions
from zisk_zorch.fri.verifier import verify
from zisk_zorch.transcript.transcript import Transcript

LOG_N = 16       # degree bound: the codeword must be a poly of degree < 2^16
LOG_BLOWUP = 1   # LDE rate -- the extended domain is 2^(LOG_N + LOG_BLOWUP)
FOLD_BITS = 4    # bits folded per FRI layer
N_LAYERS = 2     # fold rounds, so the final polynomial is 2^(17 - 2*4) = 2^9
ARITY = 4        # Merkle arity of every committed tree
N_QUERIES = 4    # opened positions (see the note below -- real proofs use ~64)
POW_BITS = 8     # grinding difficulty on the query-derivation seed
N_COLS = 8       # witness columns in the committed trace

LOG_EXT = LOG_N + LOG_BLOWUP
GOLDILOCKS_P = (1 << 64) - (1 << 32) + 1
rng = np.random.default_rng(0)


def random_base(shape):
    """Uniform Goldilocks elements, host-built then moved to the device."""
    return fnp.array(
        rng.integers(0, GOLDILOCKS_P, size=shape, dtype=np.uint64), dtype=F
    )


# The trace is the witness a ZisK run would emit, one row per cycle. commit_trace
# LDEs it onto coset 7 and merkelizes the rows with Poseidon2-Goldilocks -- the
# arity-to-1 tree pil2's MerkleTreeGL builds. The root is what a real proof puts
# in the transcript first, and this path is byte-identical to pil2-proofman's
# CUDA prover on the same input.
trace = random_base((1 << LOG_N, N_COLS))
commitment = commit_trace(trace, blowup=1 << LOG_BLOWUP, arity=ARITY)
root = [int(x) for x in commitment.root]

# The FRI polynomial: three random base polynomials of degree < 2^LOG_N, LDE'd
# onto the same coset and read as one cubic-extension column. The limbs extend
# independently because the evaluation points are base-field, which is how pil2
# carries a cubic codeword. Folding this chain keeps it low degree, so the final
# polynomial passes the degree check at LOG_N.
limbs = extend(random_base((1 << LOG_N, 3)), 1 << LOG_BLOWUP)
fri_pol = limbs.view(F3).reshape(1 << LOG_EXT)

# pil2's STARK_FRI_FOLDING schedule: fold FOLD_BITS per layer down to a final
# polynomial small enough to send in the clear.
#
# Folding less is slower, not faster -- a shorter chain leaves a longer final
# polynomial, and the verifier INTTs the whole of it for the degree check.
#
# N_QUERIES is the other cost, and neither one is the trace size: the verifier
# walks a Merkle path per (query, layer) on the host. A real pil2 proof opens
# ~64 positions; soundness comes from that count, so the 4 here prove nothing to
# a skeptic -- they are enough to watch every check fire and every forgery fail.
# Raise it and the run gets slower and more honest.
steps = [LOG_EXT - i * FOLD_BITS for i in range(N_LAYERS + 1)]


def prove_low_degree():
    """Fold, commit each layer, then open the queries the transcript picks."""
    transcript = Transcript()
    proof = prove(fri_pol, steps, arity=ARITY, transcript=transcript)
    # The prover derives its own query positions from the post-fold transcript
    # and grinds a nonce; both travel to the verifier, which re-derives them.
    indices, nonce = sample_query_positions(
        transcript,
        proof.final_pol,
        pow_bits=POW_BITS,
        n_queries=N_QUERIES,
        n_bits_ext=LOG_EXT,
    )
    return proof, prove_queries(proof, indices), nonce


def accepts(roots, final_pol, openings, nonce) -> bool:
    """Replay the transcript from a clean seed and check the whole chain: the
    grind binds the nonce, every Merkle opening verifies, every fold lands on
    the next layer, and the final polynomial is degree < 2^LOG_N."""
    return verify(
        roots,
        final_pol,
        openings,
        steps=steps,
        arity=ARITY,
        transcript=Transcript(),
        pow_bits=POW_BITS,
        nonce=nonce,
        n_bits=LOG_N,
    )


proof, openings, nonce = prove_low_degree()

# Three ways to lie, each caught by a different check. The nonce is off by one,
# so the grind no longer holds; the final polynomial is perturbed, so the last
# fold stops matching it; an opened value is perturbed, so its Merkle path stops
# hashing to the committed root.
bad_final = proof.final_pol.at[0].set(proof.final_pol[0] + fnp.ones((), F3))
bad_openings = [list(layer) for layer in openings]
first = bad_openings[0][0]
bad_openings[0][0] = first.at[0].set(first[0] + fnp.ones((), first.dtype))

print(f"committed a 2^{LOG_N} x {N_COLS} trace, root = {root}")
print(f"FRI folded 2^{LOG_EXT} -> 2^{steps[-1]} in {len(steps) - 1} layers, {N_QUERIES} queries")
print()
print("verifier accepts the proof:      ", accepts(proof.roots, proof.final_pol, openings, nonce))
print("verifier accepts a bad nonce:    ", accepts(proof.roots, proof.final_pol, openings, nonce - 1))
print("verifier accepts a bad final pol:", accepts(proof.roots, bad_final, openings, nonce))
print("verifier accepts a bad opening:  ", accepts(proof.roots, proof.final_pol, bad_openings, nonce))
