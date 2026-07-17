# bellman-zorch — bellman's entire Groth16 back-end in ONE fused GPU call.
#
# bellman synthesizes the R1CS on the CPU. Everything after that is this core:
# the h-polynomial FFT and all five MSMs, lowered into a single executable that
# runs on the xla GPU plugin. The Rust side feeds it the witness and the proving
# key, then finishes with bellman's own assembly — so the proof comes out
# byte-identical to groth16::create_proof.
#
# make_core is the crate's export/export_bellman_core.py with its h_fft helper
# inlined — the crate is Rust, so there is no package to import it from yet.
# Change LOG_N and re-run.
import frx
import frx.numpy as fnp
import numpy as np
from frx import lax
from frx.lax import NttType
from zk_dtypes import bn254_g1_affine as G1
from zk_dtypes import bn254_g2_affine as G2
from zk_dtypes import bn254_sf, pfinfo
from zk_dtypes import bn254_sf_mont as F

LOG_N = 12
n, m, num_inputs = 1 << LOG_N, 64, 2
G = F(7)  # halo2curves BN254 Fr MULTIPLICATIVE_GENERATOR


def make_core(n, m, num_inputs):
    """bellman's h pipeline: generator 7, coset trick, no bit-reverse."""

    def ntt(x, inverse):
        kind = NttType.INTT if inverse else NttType.NTT
        return lax.ntt(x, ntt_type=kind, ntt_length=n, generator=G)

    shift = fnp.array([G**i for i in range(n)], dtype=F)
    inv_shift = fnp.array([G**-i for i in range(n)], dtype=F)
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


rng = np.random.default_rng(0)


def rand(count):
    return [F(int(v)) for v in rng.integers(1, 1 << 62, size=count)]


def encode(scalars, dtype):
    """Field scalars -> that dtype's array. For a curve dtype, each k becomes k·G."""
    return np.array([int(s) for s in scalars], dtype=dtype)


# The real proving key comes from bellman. Standing in for it: points k·G whose
# k we picked, so the host can predict what the MSMs must return.
z, az, bz = rand(m), rand(n), rand(n)
k = G**5  # H_q = k^j·G, which lands the h-MSM on h(k)·G

core = make_core(n, m, num_inputs)
msm_A, msm_Bg1, msm_Bg2, msm_L, msm_h = core(
    encode(z, bn254_sf),
    encode(az, bn254_sf),
    encode(bz, bn254_sf),
    encode(rand(m), G1),
    encode(rand(m), G1),
    encode(rand(m), G2),
    encode(rand(m - num_inputs), G1),
    encode([k**j for j in range(n - 1)], G1),
)

# msm_h is the output worth checking: it is the only one that depends on the
# h-FFT, and it is still an MSM, so it covers both halves of the core at once.
# h(k) = (A(k)·B(k) - C(k)) / Z(k), with A, B, C interpolated from az/bz alone.
P = pfinfo(F).modulus
w = F(pow(7, (P - 1) // n, P))  # n-th root of unity; ** wants a long-long exponent
Zk = k**n - 1  # Z(k) = k^n - 1


def at_k(evals):
    """Interpolate evals over the n-th roots of unity, evaluate at k."""
    return sum(v * w**i * (k - w**i) ** -1 for i, v in enumerate(evals)) * Zk * F(n) ** -1


cz = [x * y for x, y in zip(az, bz)]
h_at_k = (at_k(az) * at_k(bz) - at_k(cz)) * Zk**-1
got = np.asarray(msm_h).reshape(1).view(np.uint8).tobytes()

print(f"one fused call: 7 NTTs over 2^{LOG_N} + 5 MSMs -> 5 group elements")
print(f"msm_h == h(k)·G: {got == encode([h_at_k], G1).view(np.uint8).tobytes()}")
