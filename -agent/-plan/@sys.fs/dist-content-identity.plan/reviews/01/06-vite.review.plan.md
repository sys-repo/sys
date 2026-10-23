gpt-6-astra • high
# Review for `dist-content-identity.plan.md`: Vite producer and SRI seams

```text
Mode: Blind, independent review; orthogonal falsification of build authority and Vite test ownership.

Target: /Users/phil/code/org.sys/sys. Review attributable worktree behavior for
feat(dist)!: unify build pins and verification on canonical content identity, governed by
-agent/-plan/@sys.fs/dist-content-identity.plan.md. Read this directory's README.md common contract
and R1 launch boundary first. Include the untracked external pipeline proof.

Authority: Traverse AGENTS/canon and reconcile the opening arc. Inspect live source, tests, public
contracts, reachable prior behavior and actual task closures. Plans/subjects are not proof; do not
consume checkpoint conclusions, handoffs or other reports.

Question: Do real builds expose authority only after successful production, and do SRI and pipeline
proofs exercise defensible owner seams rather than hidden downstream coupling? Primary paths:
code/sys.driver/driver-vite/src/m.vite/
code/sys.driver/driver-vite/src/-entry/-test.external/-serve.cached.process.ts
code/sys.driver/driver-vite/src/-entry/-test.fixture/serve/
code/sys.driver/driver-vite/src/m.fmt/u.Help.ts
code/sys.driver/driver-vite/deno.json
Trace normal/workspace builds, errors, successful pin/dist/manifestChecksum results, display and
pkg/-pkg.json production. Same fixed payload inventories must yield the same pin across builds;
layout/build metadata may change document checksums. Check cached serve fixture authorship against
current production without giving the serve child build authority.
Inspect -test.external/-dist.pipeline.ts and its transitive fixtures/imports. Public FS/Server
contracts and Vite-owned setup must suffice; reverse imports of downstream Cloudflare private sample
fixtures are not acceptable merely because Vite has broader test permissions. Verify task inclusion,
permission ownership, cancellation and capability-based store cleanup.
Distinguish emitted JS/CSS/preload SRI byte checks, actual browser enforcement, transitive imports,
relay confinement and private/public projection behavior. Do not infer browser or sample-workflow
execution from an HTTP fixture. Compare test organization and duplication with the owner boundaries;
propose a smaller structure only if it preserves isolated build, cached-child and SRI proofs. Explain
why retaining sound existing boundaries may be preferable to another shared helper.

Boundaries: Review only under README rules; no source/Git/dependency/permission changes or real
publication. Shared Vite/SRI/Chromium builds require a coordinator runtime slot after owning task
inspection. Never invoke the real downstream sample build. Isolated tests still require their
configured authority; a denial is a stop.

Output: Write only 06-vite.review.md beside this charter, or return it. Provide a verdict, prioritized
findings with exact path/symbol, executable sequence, invariant, minimal correction owner and closing
proof. Include an import/permission graph and test-claim table, actual commands, drift check, limits,
and optional simplifications separately.
```

gpt-6-astra • high
# Review for `dist-content-identity.plan.md`: Vite producer and SRI seams
