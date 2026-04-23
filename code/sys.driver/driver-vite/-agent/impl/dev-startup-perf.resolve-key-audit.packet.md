# Packet E: outside-in resolve-key audit and canonical identity tightening

## Status
Planning note only.
No implementation in this note.

## Depends on
- `./dev-startup-perf.callsite-cache-truth.md`
- `../plans/dev-startup-perf.review.md`
- `../plans/dev-startup-perf.resolve-reuse.packet.md`
- `../plans/dev-startup-perf.transport-cache.packet.md`

## Goal
Identify the first point where semantically equivalent remote identities diverge in the resolve lane, classify the exact fault class responsible, then tighten canonicalization and alias collapse only where authority truth permits.

## Trigger
Outside-in follow-up dev-start logs after Packet D now prove all of these at once:
- transform cache writes under Vite cache ownership
- transform cache hits are real on follow-up dev start
- cached `loadDenoModule(...)` reuse is materially cheap
- `transport.resolveDeno` still dominates cumulative cost
- equivalent remote identities are still alive in split forms, including both:
  - `https://jsr.io/...`
  - `https:/jsr.io/...`

That means the next dominant driver-owned seam is no longer transform persistence.
It is resolve identity truth and reuse collapse.

## Governing invariant
Equivalent authority-scoped remote resolution requests should enter the expensive resolve path under one canonical identity.

If that invariant is not enforced early enough, single-flight and settled reuse will still leave large amounts of duplicated or fragmented work alive.

## Scope
This packet should do only this:
1. audit the real call-site resolve lane
2. find the first divergence point for `https:/` versus `https://`
3. identify which fault class is actually responsible
4. identify which request-key, canonicalization, or alias boundary is too weak or too late
5. implement the smallest truthful normalization / alias-collapse fix
6. remeasure the same outside-in call site
7. stop

## Not in this packet
- transform cache changes
- persistent resolve cache
- npm prewarm narrowing
- Vite-native warmup or dep-optimization tuning
- app graph cleanup
- UI entry / OXC / TsconfigCache seam work

## Code anchors
Primary:
- `code/sys.driver/driver-vite/src/m.vite.transport/u.specifier.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.resolve.test.ts`

Read `u.specifier.ts` fully before deciding that the fault is missing normalization rather than a late or inconsistent application site.

Secondary only if the audit proves they participate in identity drift:
- `code/sys.driver/driver-vite/src/m.vite.transport/u.load.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.load.test.ts`

## Audit questions
1. Where does `https:/` first appear in the real resolve path?
2. Is request-key formation happening before canonical remote normalization?
3. Does redirect aliasing happen too late to prevent duplicated work, including concurrent work before alias write-back?
4. Does importer dependency hydration reintroduce split remote identities after canonicalization?
5. Are parent and child graph hydration paths using different identity rules for the same semantic target?
6. Which cwd / importer / authority distinctions must remain distinct even after canonicalization?

## Required pre-implementation evidence
Before any implementation change, capture enough evidence to answer all of these:
- which exact specifiers dominate repeated resolve volume in one real dev-start trace
- what fraction of calls are `miss`, `inflight-hit`, `settled-hit`, and `alias-hit`
- whether `https:/...` and `https://...` are semantically equivalent in the relevant Deno resolution path for the targeted cases
- whether the duplication is dominated by repeated equivalent ids rather than mostly legitimate unique ids

Minimum required artifact quality:
- one per-specifier frequency histogram from a single representative trace
- one summary of hit/miss/coalescing effectiveness
- one explicit statement of whether remote-form equivalence was observed or disproved

## Required trace points
Use narrow env-gated or temporary instrumentation to capture, at minimum:
- raw id entering `resolveDenoWith(...)`
- canonicalized remote id, if any
- request key before lookup
- alias key lookup / write timing
- importer-derived ids
- dependency-derived ids
- redirect-derived ids
- settled-hit / inflight-hit / alias-hit / miss classification

The point of this trace is not broad logging volume.
The point is to identify the first identity split with enough precision to classify the fault before implementing one narrow fix.

## Candidate fault classes
This packet should explicitly decide among these possibilities rather than blending them:
- canonical remote normalization is missing or incomplete
- request key is formed before canonical remote normalization
- redirect aliasing is correct but arrives too late to help the dominant misses or concurrent requests
- importer graph hydration stores dependencies in mixed raw/canonical forms
- parent and child graph hydration use different identity vocabularies for equivalent remotes
- canonicalization helper exists but is not applied consistently at the resolver boundary

Do not start implementation until one primary fault class is named explicitly.
If multiple candidates remain alive, continue the audit instead of blending fixes.

## Pre-implementation checkpoint
Before writing code, produce a short findings checkpoint in:
- `./dev-startup-perf.resolve-key-audit.findings.md`

That checkpoint must name all of these explicitly:
1. the first meaningful divergence point
2. the confirmed primary fault class
3. the proposed narrow fix shape
4. the main correctness risks and why broader alternatives were rejected

No implementation should start until that checkpoint is written and reviewed.

## Acceptance
This packet is successful only if it produces all of these:
1. the first meaningful divergence point is identified
2. the primary fault class is written down explicitly before implementation
3. the smallest truthful normalization / alias rule is written down explicitly
4. deterministic tests are added or updated to pin that rule
5. the same outside-in call site shows materially lower resolve churn after the fix

Primary payoff metrics:
- lower `transport.resolveDeno count`
- lower `transport.resolveDeno total`
- fewer duplicated equivalent ids in perf logs
- no transport correctness regression in targeted tests

## Stop conditions
Stop and re-plan if any of these become true:
- the split does not originate in the resolver boundary
- the required collapse would erase a real authority distinction
- `https:/...` and `https://...` are not semantically equivalent in the targeted path
- the per-specifier histogram shows the volume is dominated by mostly unique legitimate work
- the measured payoff is too small to justify added complexity
- the next dominant cost turns out to be outside this owner seam

## Risks / watchouts
- If normalization changes ids visible to Vite module-graph bookkeeping, verify no graph-split or duplicate-node behavior is introduced.
- Do not use Packet E to smuggle in persistent resolve-cache work; that is a separate lane unless the audit proves this packet is the wrong battlefield.
- If the audit shows redirect alias timing is the primary fault, prefer narrowing alias write timing before introducing new canonicalization helpers.

## First-pass implementation posture
Do not start by editing multiple surfaces at once.
The first pass should be:
1. trace
2. produce the per-specifier histogram and coalescing summary
3. identify first split
4. classify the primary fault
5. write `./dev-startup-perf.resolve-key-audit.findings.md`
6. write one deterministic failing test
7. implement one narrow normalization or alias-collapse change
8. remeasure
9. stop and reassess

## Suggested commit shape when ready
If the audit produces a narrow truthful fix, prefer a commit message in the shape:

```text
perf(driver-vite): collapse equivalent remote resolve identities earlier
```

Only use that after the audit proves the exact implementation move.
