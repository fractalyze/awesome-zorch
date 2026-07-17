# Groth16 — prove a circom circuit on the GPU, then verify the proof.
#
# groth16-zorch takes circom/snarkjs artifacts as they are: the proving key is
# the same .zkey snarkjs proves with, and the proof serializes straight back to
# snarkjs-compatible JSON. Az/Bz are evaluated in pure frx over the BN254 field
# dtype, so the R1CS mat-vec runs on the GPU alongside the five MSMs — no native
# library involved.
#
# multiplier_3 proves knowledge of a, b, c behind the public product a*b*c.
# Change A, B, C below and re-run: the witness — the six wires
# [1, out, a, b, c, a*b] — is built straight from your inputs, so no witness
# calculator or .wtns file is needed for this circuit. The .zkey is
# trusted-setup output, so it stays inlined at the bottom. Pass no_zk=True for
# the deterministic (r = s = 0) proof.
import base64
import gzip
import pathlib
import tempfile

import numpy as np
from zk_dtypes import bn254_sf, bn254_sf_mont

from groth16_zorch.circom.zkey import parse_zkey
from groth16_zorch.circom.zkey_to_terms import zkey_to_terms
from groth16_zorch.groth16 import compile_circom, write_public_signals
from groth16_zorch.groth16.verifier import VerificationKey, verify
from groth16_zorch.r1cs import compute_abc

A, B, C = 3, 4, 5  # the private inputs — edit and re-run


def multiplier_3_witness(a, b, c):
    """Wires for out === a*b*c: [1, out, a, b, c, inter=a*b]."""
    wires = [1, a * b * c, a, b, c, a * b]
    return np.array(wires, dtype=bn254_sf), wires


def main():
    zkey_path = pathlib.Path(tempfile.mkdtemp()) / "multiplier_3.zkey"
    zkey_path.write_bytes(gzip.decompress(base64.b64decode(ZKEY_GZ)))
    zkey = parse_zkey(zkey_path)

    witnesses, witness_ints = multiplier_3_witness(A, B, C)

    compiled = compile_circom(zkey)  # NTT twiddles + point arrays, once
    _, coefficients = zkey_to_terms(zkey)
    az, bz = compute_abc(  # R1CS mat-vec for Az/Bz, on the GPU
        witnesses.view(np.dtype(bn254_sf_mont)),
        compiled.terms,
        coefficients,
        compiled.domain_size,
    )

    signals = write_public_signals(witness_ints, compiled.config.num_public)
    proof, public_signals = compiled.prove(witnesses, az, bz, signals)

    vk = VerificationKey.from_zkey(zkey)
    snarkjs = proof.to_json()
    print("verifier accepts:", verify(vk, proof, public_signals))
    print("public output:", public_signals[0], "=", A, "*", B, "*", C)
    print("proof:", snarkjs["protocol"], "over", snarkjs["curve"])
    print("pi_a.x:", snarkjs["pi_a"][0])


# circom multiplier_3 proving key — the .zkey snarkjs proves with, gzip+base64.
ZKEY_GZ = """
H4sIABl1WWoC/+1XZ1AT2BZOYAmhB4UIAUlCkdCRAEovITR5dJaO9AUpht5EqkFdEAQEQu8CCgiC
dBQkyEpHKSoikS4qhABCaE9Gnee8P7sz+2Pnzbxv5sy9d+bcc0/75t4b7uUWBgQAAIxf5Xj8BfAN
x3Oar5JO822N+Co6B1emoIkI5aTnfh63L8Vk2lvFxDzCGjeLFJ4l+Ru6SiO+7VtP2yJhbuNawnSX
0aj/1gH9dM7+4gDCtkpfdz4KjkhkVkiVyBhKpLedgRx43LzuvOop8WKWnpgqdbefyT5/VrNOmdHT
VfCoqURbDsebQqqE6TA/5QiWXA0NYxfaGXU/0dllSYUSnWRGuzjK9iCXuiFNsJQeCTIvnNsgmfhw
LbxactFYNLBv+DVOVd06Oyn4fjLjlP44KTNq0+PNCq882rTj/YpyQNB9xVRN6hPpsffBIkDMpeLt
kBdR0ZVxMvnnztvvFVRKsrVzLMDHobsdv/GjYWpdFtdLgXi4wKRQVAVbwY0l7ca5lSIWtyzGAQ+L
WCrz5U7oyYJ5qwWhqRe/vmusEke1l73zDDVypOcqzOu39pM6g2inGW2Mu+UPjNCT416dfgeLydQ5
07ynZJxRq3HeklvdyaAiMqChtmeKxsrmLcYRL1Voum+8wuAV8UExbv2QY3vF63oeNc8pNCd/K3Ms
6vAwkkfAGZZ/BNLMr1m9eoD6/CvXs19tGVzblCNl+Hctp4MhcuhOuV2LWNeDtMXCUpYboA98obBr
QTcszfzm3J8UQIBXvUXSdlxtb3tP3NF9Cnyjy0R43EfOEnd7pV8hm2OAU8GIhiXVnZ/kFP7N+PoF
5MOXiem5NEhNKWXW3wclDchPZg/KCwb3yXye+ci6B9Zgb+kV5P1oiGfujK/OGPLgA+u7u6VCU2/e
6M8t+qLRs/D51o/9dZ3c6VPw6Et4G7NNwViTLwbBn0d8V4sDX6sxnTxRKICya4iE2unEkGHVPfAS
hRqGmH5Eg+tZxIsQNEia9msPRX/v13cWomo0LENGp0ira4+JgQZRvTw+Tk1BwvHrC2kMwle4GeGI
hZJnwO23sjklIIr8l9iu38/sOYqojuo79ZW4HaGIZPA0exXaZ1U6wLLJz2e1JGle45GxN0peEidh
HjHH2Ax5ob62WhMSAP7lFWuJjbDACWd5CBE2t3cbQ7GF54GO+5kZ+M0XEOA/OKaPTeqMhiGbCKoG
ap+RUS33cnKSKBHWDRKPt51z6or8l+T3bYDjeO76IGuwi808c9Z2c3WKh2bXotvMVOL0Esu0DKPq
RqA0P7hJ9xft/uDaX7H7nep/SZf2u+0/0z32M/p7gGoVhpiL5vJbNRS8XsonphKR0+jpt+bClxdv
S1o9w+ijnOYp5ShEfL5gu+bj2mjeVkwIuCQtjksQ0qZSTKdeDqm6YWaV6Y6ubxNOES4EiiYs6hlH
xZrLJk4S5ViPhM6eUghmFDcHswR7Pn97JUuxTCi5Uu31Y68CyiOHvWQ70WmucVOK1pu8jqWd6Vu3
e/qApIaNcVUL1Dw9OtbDXMsJxxaOZ2CJpnG3iZjzy04pxgYciSXwrHGKBB2oQJhbSNNSgH8YCQF7
rpHObAzyguF8K7fwJ7AfvOyY71nWWyuqMl8E0NHXkNNMcjM7+lMnODdr6QbWuF0K1pVKITD4nDXP
ozx9NtBPtfhfx5/VcjA4oD/jRiuJfeloENCnJOggTnV7JiWMEXdGjrd4J/xpLglMK/jwTWcclWIb
SHJtvIvZIqWEF6nlM3ZMEtsfcCP/rv/0P0j0f/zj2JmP5HnJ/OXp7zGTp+oFt8oHtzYw7Nvdi4QD
cRHKBSTQZPWlezYA3FFrv3vJTLxNj49CiwWFJlM/dBo23eVQR/mEtLJS5S2cKJkcoS1J4SFwrtNZ
5CplJSsXO9wtxj1Rwo5cBO3IToGTTPIbcuuB9p36jRTCcpQrObSXNdmTg8t8UWbNKJUpqtSopqVx
7TF4JilnGGwozcPgPipfJgqT/BjLEUmlv/rRErujp1GExn/Qb2g0mvw8fi679FUyoynyoZrlVM7q
XBAqtcZCOhTle4fRvxq7cPNmQHJg2xDyBe89SSbb1UkBew9iboZHqZOANmxrTa92yxuvmVWuTlcp
8E/nH/zjUvuKQy1Z8zO/oKf4FwxMVJ+AbRh9wv3HH2Zvat8bPt++ucSXF5kux7nCmA6DlBN0nvUc
8hUYZYiZVBLL4AnkHbCTtEtKa3Y3P5PpLqyfxCJUeydnAgwZjJMWIp4DDrA48tPv5IPIorpVWPEe
wwYjcrDrlNQm3U64+Huwcy1nlt1FaORhoGr48ic5Q1rWiiFrwLC20B8OHqPBRUICZSfblnul4qUy
bnlywbkCZXFphFB8kiep8+oGVyuARcO2GT7tBdHQdqjvGFXnGfhSoA6eUfQad6QEwwlZVhWlJN9Y
iDbtTtq1nhqsOo5aT8/aFCkB3HjtMC3blI66MyPe1L5bDWb4KRdm9ljK/kexj4AJqPyFOfa20vvy
ZTZT4o2ERte+pDshrD3W6NpGkON0lFnyhLolm6upt4v0ZrFJlrxYzibn6Q6A1MVe27E+UHxUvTr/
3tCGHsGytlzjqXUSebDfi0WeG0B4WLgxtrgVCt9e6pJIO9l2ZoY6OCZVRL+VtF/Mo/KW/TKSu2cn
nWl4otAX6+Amm54S8ihf9GGvmEyf7hOEAlBMxOwUnC4jZnoXWBVImyFJB+OX+vRoTytPMw5oKRh3
Ujq9t/3tVdyFze4cTyeqTrhNtN21iPvBNjJdm7PmWck3WdW7d9PP1UKI0DX0tgMYMaaQKEWT2Lt2
U2Xh9FZahRfP8Z/k/fdc8FHucVDwvxXScaq67JMG7vHaAa6JuUqoKWgp6XVj7BBey3QIvla12aC7
26JZ9bPOu7fg2u7IpPt9wykxYo4mssdm/u57N7c27+nyhppOatFytTZO0FDXXdN0SbHIBR/S21oP
5WOuPu34zob7pdj684Z27egWAf/z2CWHKFzR8HNOoXbl56dMq/hoQfmfP5U4qm4T6dz/oMeprXp1
fE7SzZ/hOafVAjCRw3CRua6oCSgBx877zsdG6C08X3ppICyN3TulH8LHYN7YtilXkBCgcuAQntHO
/gB7tqGm3WCogfpqKLNmxIXTL2CEA1VPOBQZRiVgeczCEBHmnR08BNWthcJS3tADhPyJytiJfZX4
9abGpTy2CkzNg3Tn3JEOJM2FwgJztQgYeinbJn2g+EYhgB7NTm8S+Nk07/XU08fEnnLxgtCp3dNu
rxTOiDg250N5y5UevIeqTp2rw5v5RbbmogjrpGFUs5Ysq520YLWQEFd/PMJhUIDKaht21GfEX4rv
T60bUbl3XEfocXtznA0IRGAu+wb6ezoHBV72Rxg6+bj9G29ZW7uKDgAA"""

main()
