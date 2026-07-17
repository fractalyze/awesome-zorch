# bellman-zorch — bellman's entire Groth16 back-end in ONE fused GPU call.
#
# bellman synthesizes the R1CS on the CPU. Everything after that is this core:
# the h-polynomial FFT and all five MSMs, lowered into a single executable that
# runs on the xla GPU plugin. The Rust side feeds it the witness and the proving
# key, then finishes with bellman's own assembly — so the proof comes out
# byte-identical to groth16::create_proof.
#
# The h-FFT is bellman's exact convention: generator 7, coset trick, no
# bit-reverse. A satisfied R1CS has C·z = (A·z)∘(B·z) pointwise, so the core
# derives cz itself and takes only az/bz.
#
# The real proving key comes from bellman. Here every CRS point is k·G for a
# known k — casting an int to a curve dtype gives you k·G — so each MSM has a
# closed form the host can check in plain Python. Change LOG_N and re-run.
import frx
import frx.numpy as fnp
import numpy as np
from frx import lax
from frx.lax import NttType
from zk_dtypes import bn254_g1_affine, bn254_g2_affine, bn254_sf, bn254_sf_mont, pfinfo

LOG_N = 12
n, m, num_inputs = 1 << LOG_N, 64, 2
P = pfinfo(bn254_sf_mont).modulus  # BN254 scalar field modulus
G = 7  # halo2curves BN254 Fr MULTIPLICATIVE_GENERATOR


def transform(x, inverse):
    kind = NttType.INTT if inverse else NttType.NTT
    return lax.ntt(x, ntt_type=kind, ntt_length=n, generator=G)


def mont(values):
    return fnp.array(values, dtype=bn254_sf_mont)


shift = mont([pow(G, i, P) for i in range(n)])
inv_shift = mont([pow(pow(G, P - 2, P), i, P) for i in range(n)])
den = mont(pow((pow(G, n, P) - 1) % P, P - 2, P))  # 1/Z on the coset


@frx.jit
def core(z, az, bz, a_q, bg1_q, bg2_q, l_q, h_q):
    az_m = lax.convert_element_type(az, bn254_sf_mont)
    bz_m = lax.convert_element_type(bz, bn254_sf_mont)
    a, b = transform(az_m, True), transform(bz_m, True)
    c = transform(az_m * bz_m, True)
    ac, bc = transform(a * shift, False), transform(b * shift, False)
    cc = transform(c * shift, False)
    h = transform((ac * bc - cc) * den, True) * inv_shift
    h = lax.convert_element_type(h, bn254_sf)[: n - 1]  # deg h <= n-2
    return (
        lax.msm(z, a_q),
        lax.msm(z, bg1_q),
        lax.msm(z, bg2_q),
        lax.msm(z[num_inputs:], l_q),
        lax.msm(h, h_q),
    )


rng = np.random.default_rng(0)


def rand(count):
    return [int(v) for v in rng.integers(1, 1 << 62, size=count)]


z, az, bz = rand(m), rand(n), rand(n)
kA, kB1, kB2, kL = rand(m), rand(m), rand(m), rand(m - num_inputs)
k = pow(G, 5, P)  # h_q = k^j·G, so the h-MSM lands on h(k)·G

msm_A, msm_Bg1, msm_Bg2, msm_L, msm_h = core(
    np.array(z, dtype=bn254_sf),
    np.array(az, dtype=bn254_sf),
    np.array(bz, dtype=bn254_sf),
    np.array(kA, dtype=bn254_g1_affine),
    np.array(kB1, dtype=bn254_g1_affine),
    np.array(kB2, dtype=bn254_g2_affine),
    np.array(kL, dtype=bn254_g1_affine),
    np.array([pow(k, j, P) for j in range(n - 1)], dtype=bn254_g1_affine),
)

# Independent reference: the same five values, on the host in plain Python ints.
w = pow(G, (P - 1) // n, P)  # primitive n-th root of unity
Zk = (pow(k, n, P) - 1) % P  # Z(k) = k^n - 1


def at_k(evals):
    """Interpolate evals over the n-th roots of unity, evaluate at k."""
    total = sum(v * pow(w, i, P) * pow(k - pow(w, i, P), P - 2, P) for i, v in enumerate(evals))
    return total * Zk * pow(n, P - 2, P) % P


def dot(scalars, ks):
    return sum(s * i for s, i in zip(scalars, ks)) % P


cz = [x * y % P for x, y in zip(az, bz)]
h_at_k = (at_k(az) * at_k(bz) - at_k(cz)) * pow(Zk, P - 2, P) % P
checks = [
    ("msm_A:G1", msm_A, dot(z, kA), bn254_g1_affine),
    ("msm_Bg1:G1", msm_Bg1, dot(z, kB1), bn254_g1_affine),
    ("msm_Bg2:G2", msm_Bg2, dot(z, kB2), bn254_g2_affine),
    ("msm_L:G1", msm_L, dot(z[num_inputs:], kL), bn254_g1_affine),
    ("msm_h:G1", msm_h, h_at_k, bn254_g1_affine),
]

for label, got, want, dtype in checks:
    gpu = np.asarray(got).reshape(1).view(np.uint8).tobytes()
    ref = np.array([want], dtype=dtype).view(np.uint8).tobytes()
    print(f"{label:11} matches the host reference: {gpu == ref}")
print(f"\none fused call: 7 NTTs over 2^{LOG_N} + 5 MSMs -> 5 group elements")
