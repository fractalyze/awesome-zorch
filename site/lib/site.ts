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

/**
 * Playground pre-loaded with a library's runnable `quickstart` via the `#code`
 * deep link. The snippet rides in the URL *fragment* — never sent to any server
 * or logged — and is URL-encoded so the playground recovers it verbatim with
 * `URLSearchParams` (generate and parse are symmetric); `run=1` auto-runs it on
 * arrival, which is what the visitor asked for by clicking "Run". Falls back to
 * the bare playground when a library has no quickstart yet.
 *
 * This replaces the old `?template=<id>` convention, which required the
 * playground team to hand-wire a template per library — the code is now the
 * single source of truth in this repo. Round-trip guard:
 * test/playground-url.test.mjs.
 */
export function playgroundUrl(lib?: { id: string; quickstart?: string }): string {
  if (!lib?.quickstart) return SITE.playground;
  const frag = new URLSearchParams({ code: lib.quickstart, title: lib.id, run: "1" });
  return `${SITE.playground}/#${frag.toString()}`;
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
