# bellman-zorch — bellman's entire Groth16 back-end in ONE fused GPU call.
#
# bellman synthesizes the R1CS on the CPU. Everything after that is this core:
# the h-polynomial FFT and all five MSMs, lowered into a single executable that
# runs on the xla GPU plugin. The Rust side feeds it the witness and the proving
# key, then finishes with bellman's own assembly — so the proof comes out
# byte-identical to groth16::create_proof.
#
# make_core is the crate's export/export_bellman_core.py with its h_fft helper
# inlined. The crate is Rust, so there is nothing to import it from — over there
# this same function is lowered to bytecode once and run from Rust, on a real
# bellman proving key. Change LOG_N and re-run.
import frx
import frx.numpy as fnp
import numpy as np
from frx import lax
from frx.lax import NttType
from zk_dtypes import bn254_g1_affine as G1
from zk_dtypes import bn254_g2_affine as G2
from zk_dtypes import bn254_sf
from zk_dtypes import bn254_sf_mont as F

LOG_N = 12
n, m, num_inputs = 1 << LOG_N, 64, 2
G = F(7)  # halo2curves BN254 Fr MULTIPLICATIVE_GENERATOR


def make_core(n, m, num_inputs):
    """bellman's h pipeline: generator 7, coset trick, no bit-reverse."""

    def ntt(x, inverse):
        kind = NttType.INTT if inverse else NttType.NTT
        return lax.ntt(x, ntt_type=kind, ntt_length=n, generator=G)

    G_inv = G**-1
    shift = fnp.array([G**i for i in range(n)], dtype=F)
    inv_shift = fnp.array([G_inv**i for i in range(n)], dtype=F)
    den = fnp.array((G**n - 1) ** -1, dtype=F)  # 1/Z on the coset

    @frx.jit
    def core(z, az, bz, a_q, bg1_q, bg2_q, l_q, h_q):
        az_m = lax.convert_element_type(az, F)
        bz_m = lax.convert_element_type(bz, F)
        # A satisfied R1CS has C·z = (A·z)∘(B·z), so cz comes for free.
        a, b, c = ntt(az_m, True), ntt(bz_m, True), ntt(az_m * bz_m, True)
        ac, bc, cc = ntt(a * shift, False), ntt(b * shift, False), ntt(c * shift, False)
        h = ntt((ac * bc - cc) * den, True) * inv_shift
        h = lax.convert_element_type(h, bn254_sf)[: n - 1]  # deg h <= n-2
        return (
            lax.msm(z, a_q),
            lax.msm(z, bg1_q),
            lax.msm(z, bg2_q),
            lax.msm(z[num_inputs:], l_q),
            lax.msm(h, h_q),
        )

    return core


# One executable, fixed to this shape — lax.ntt/lax.msm lower shape-specialized.
core = make_core(n, m, num_inputs)

# Stand-ins for what bellman hands the Rust prover: the witness z, the A·z / B·z
# evaluation vectors, and the CRS. Casting an int k to a curve dtype gives k·G,
# which is enough to make the call real — the values come from bellman.
rng = np.random.default_rng(0)


def rand(count, dtype):
    return np.array(rng.integers(1, 1 << 62, size=count), dtype=dtype)


msms = core(
    rand(m, bn254_sf),  # z = [inputs ‖ aux], the full assignment
    rand(n, bn254_sf),  # az = A·z
    rand(n, bn254_sf),  # bz = B·z
    rand(m, G1),  # A_q, and the four below: bellman's CRS, dense order
    rand(m, G1),  # Bg1_q
    rand(m, G2),  # Bg2_q
    rand(m - num_inputs, G1),  # L_q
    rand(n - 1, G1),  # H_q
)

print(f"7 NTTs over 2^{LOG_N} + 5 MSMs, one fused GPU call:")
for label, msm in zip(("msm_A", "msm_Bg1", "msm_Bg2", "msm_L", "msm_h"), msms):
    print(f"  {label:8}{str(np.asarray(msm))[:62]}…")
print("\nbellman's assembly turns these five into the proof, on the CPU.")
