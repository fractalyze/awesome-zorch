// Branding + external links, centralized: product names are placeholders until
// the naming round, so a rename must stay a one-file change.
export const SITE = {
  name: "zorch",
  title: "zorch: take your ZK research to production, fast",
  description:
    "ZK provers you can actually read, at GPU speed, byte-identical to upstream. Browse the zorch libraries and try them.",
  org: "fractalyze",
  coreRepo: "https://github.com/fractalyze/zorch",
  dataRepo: "https://github.com/fractalyze/awesome-zorch",
  playground: "https://playground.fractalyze.ai",
} as const;

/** Playground pre-loaded with a library's template (convention: ?template=<id>). */
export function playgroundUrl(id?: string): string {
  return id ? `${SITE.playground}/?template=${id}` : SITE.playground;
}

export const HERO_SNIPPET = `import zorch
import zorch.numpy as znp        # NumPy for field operations
from zk_dtypes import babybear   # ZK field dtypes

class Brakedown(zorch.PCS):
    @zorch.jit                   # JIT-compiled to fused GPU kernels
    def commit(self, poly: znp.array) -> Commitment: ...

    @zorch.jit
    def open(self, c: Commitment, points: znp.array) -> Proof: ...

# Compose a prover from the blocks you choose
prover = zorch.Prover(field=babybear, pcs=Brakedown())
proof = prover.prove(input)`;
