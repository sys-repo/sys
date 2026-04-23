# Packet A: `driver-vite` resolve reuse correctness with measured payoff

## Depends on
- `./dev-startup-perf.review.md`
- `../tmind/dev-startup-perf/01.mechanism-breakdown.md`
- `../tmind/dev-startup-perf/02.cost-ownership.md`
- `../tmind/dev-startup-perf/03.cache-posture.md`
- `../tmind/dev-startup-perf/04.transport-economics.md`
- `../tmind/dev-startup-perf/05.vite-native-levers.md`
- `../tmind/dev-startup-perf/07.measurement-and-proof-design.md`
- `../tmind/dev-startup-perf/08.stier-cross-review.md`
- `../tmind/dev-startup-perf/09.distill-ranked-actions.md`

## Status
Historical/implemented packet note.

Packet A landed in the transport resolver as a session-local reuse layer:
- inflight single-flight reuse
- settled alias reuse
- retry-safe inflight cleanup on failure/null outcomes

Phase A3 negative caching was not opened.
Current outside-in cache/resolve truth is tracked in:
- `./dev-startup-perf.callsite-cache-truth.md`

## Goal
Convert the first measured startup truth into the narrowest high-value implementation packet.

This packet is **not** a general startup-performance packet.
It is a resolver reuse correctness packet whose payoff should be measured in startup terms.

The packet should improve real dev cold-start / first-load feel while preserving:
- published-boundary truth
- startup delivery correctness
- authority correctness
- and clean owner separation.

## Governing invariant
Equivalent authority-scoped resolution requests within one dev session should pay the subprocess cost at most once.

If that invariant is enforced cleanly, performance should improve as a consequence.
If that invariant is not enforced, broader startup tuning risks becoming symptom treatment.

## Hard verdict after re-review
Yes: the current plan direction is right, but it should be sharpened into one sharper packet.

Packet A should be only:
1. **single-flight resolve reuse** for repeated `deno info --json` work
2. **canonical request-key / alias normalization** so equivalent requests hit the same reuse path
3. **optional same-session negative caching only if measurement proves repeated misses/external churn**
4. **remeasure**
5. **stop**

Not in Packet A:
- `sys:npm-prewarm` narrowing
- `dev.warmup`
- `optimizeDeps.include`
- persistent cache work
- transform redesign

This is the stronger, more timeless formulation because it attacks the classic three causes of wasted work:
- doing the same work concurrently
- doing the same work again under a different name
- doing unnecessary broad work before the user needs it

---

# Source-insight backtrace

## From `01.mechanism-breakdown.md`
The cold path includes both pre-ready startup work and entry-triggered transport work.
So the optimization must improve true graph expansion cost, not only config prettiness.

## From `02.cost-ownership.md`
This is a driver-owned lane because the driver controls:
- transport resolution orchestration
- in-process cache posture
- npm prewarm policy

## From `03.cache-posture.md`
The current line is stronger on determinism than on cross-restart reuse.
That is acceptable for correctness, but it means we should first improve session-local dedupe before reaching for larger persistent-cache machinery.

## From `04.transport-economics.md`
Transport remained the strongest hot-seam hypothesis.
The new instrumentation now upgrades that from suspicion to measured priority.

## From `05.vite-native-levers.md`
`dev.warmup` and `optimizeDeps.include` still matter, but they are helpers if transport orchestration is wasting work.

## From `07.measurement-and-proof-design.md`
This lane must prove:
- where time went
- who owned it
- what changed after each intervention
- and whether cold startup really improved

## From `08.stier-cross-review.md`
The major false-friend is symptom treatment.
If transport reuse is broken, Vite-native tuning may make charts prettier while leaving the main driver-owned waste in place.

## From `09.distill-ranked-actions.md`
The current measured ranking is already pointing at repeated `resolveDeno` work first and npm prewarm second.
This packet keeps that ranking, but makes the first item more precise and more implementation-ready.

---

# Current evidence
A local `ui-react-components` dev run showed:

- `transport.resolveDeno count=161`
- `transport.resolveDeno total=65142`
- repeated resolution of equivalent `@std/*` targets
- inconsistent-looking specifier variants such as:
  - `https://jsr.io/...`
  - `https:/jsr.io/...`
- `config.npmPrewarm specifiers=82`
- `config.npmPrewarm elapsed=1634`
- comparatively cheap config work:
  - `config.workspace≈9ms`
  - `config.app≈25ms`

## Additional code-reading signal
Current transport caching in `src/m.vite.transport/u.resolve.ts` stores only **settled** values in a `Map<string, DenoResolved>`.
That means repeated concurrent misses can still fan out into repeated subprocess calls before the first result lands.

That is a classic single-flight gap.

So the first implementation should not be framed only as “normalize strings better.”
It should be framed as:
- **coalesce equivalent work while it is in flight**
- and **canonicalize aliases so the coalescing boundary is truthful**.

---

# STIER recommendation
## Best next packet
Packet A should do only this:
1. implement resolve single-flight
2. remeasure the same local world
3. implement alias-safe normalization where proven necessary
4. remeasure again
5. only if still justified, add same-session negative caching
6. remeasure again
7. stop

## Separate follow-ups, not part of Packet A
- `sys:npm-prewarm` narrowing
- Vite-native warmup/deps tuning
- persistent cross-restart cache
- transform redesign

Those may still matter later, but the present proof does not justify mixing them into the first implementation packet.

---

# Timeless CompSci framing
The best engineering move here is not tool-specific cleverness.
It is a classic optimization stack:

## 1. Normalize
Map equivalent requests to the same canonical identity before expensive work.

## 2. Coalesce
If equivalent expensive work is already in progress, share the future rather than launch another one.

## 3. Alias
After the truth is known, remember all valid names for the same result.

## 4. Memoize positive results
Do not recompute known answers inside the same authority world.

## 5. Memoize negative results carefully
Do not repeatedly pay for the same miss/external result inside one session.

## 6. Defer or narrow broad work
If work is not needed for first-use correctness, move it out of the critical path.

That stack is older than Vite and Deno and is still the right posture now.

---

# Packet doctrine
- preserve published-boundary truth
- preserve authority correctness
- no fake local-source privilege
- no broad transport redesign yet
- no persistent-cache expansion before session-local reuse is honest and strong
- no `sys:npm-prewarm` change in Packet A
- no Vite-native tuning in Packet A
- optimize the resolver invariant first; treat perf gains as confirmation, not substitute proof

---

# Phase 1 — resolve reuse audit, but at the right abstraction level

## Objective
Determine whether the current repeated resolution cost is primarily caused by:
- concurrent duplicate misses,
- alias/key-shape fragmentation,
- repeated parent-graph hydration,
- repeated child-graph hydration,
- repeated unresolved/external misses,
- or some deeper design limit.

## Questions to answer
1. What is the exact lookup key today for each `resolveDenoWith(...)` call site?
2. Which repeated calls are truly concurrent duplicates versus later legitimate repeats?
3. Are we resolving the same semantic target under multiple string forms?
4. Are `https://...` and `https:/...` variants both entering the miss path?
5. Are parent graph hydration misses being repeated before the parent cache is populated?
6. Are child graph hydration misses being repeated before the child cache is populated?
7. Are unresolved / external outcomes being retried pointlessly in the same session?
8. Which cache-key dimensions are semantically necessary, and which are only accidental string drift?

## Required trace outputs
Use narrow temporary or env-gated instrumentation to capture:
- input request key
- canonicalized request key if any
- hit type:
  - settled hit
  - inflight hit
  - alias hit
  - negative hit
  - miss
- importer / cwd / parent context where relevant
- reason for miss classification if practical

## Acceptance
A good Phase 1 outcome identifies at least one of:
- a missing single-flight boundary
- a canonicalization bug or alias split
- a negative-cache gap
- a cache-key dimension that must remain distinct
- or a deeper design limit that means local reuse is not enough

Any of those is useful truth.

---

# Phase 2 — resolve implementation: single-flight first, normalization second

## Objective
Make repeated equivalent resolution work collapse correctly inside a running dev session.

## Core design
Introduce a small session-local resolver memo layer with four first-class concepts:

### A. request key
The key representing the current authority-scoped resolution request.
This must not erase distinctions that change truth.

Before implementation, this packet must force an explicit answer to:
- which fields define authority?
- which importer/cwd/root dimensions can change truth?
- which dimensions are only accidental string drift?
- which normalized URL forms are guaranteed equivalent?

### B. inflight map
`Map<RequestKey, Promise<DenoResolved | null>>`

This is the most important addition.
If a request is already being resolved, later equivalent callers should await the same promise.

### C. settled map
`Map<RequestKey, DenoResolved | null>`

This stores completed session-local truth, including safe negative results if adopted.

### D. alias map
`Map<AliasKey, RequestKey>`

Once a resolution succeeds, equivalent names should point at the canonical settled entry, for example:
- original input specifier
- redirected specifier
- canonical remote URL
- local cache path
- known dependency-resolved form where safe

### E. negative map
`Map<RequestKey, null>` or equivalent policy seam

This is intentionally demoted.
Do not implement it in the first patch unless measurement proves repeated same-session miss/external churn that survives single-flight plus alias normalization.

## Resolver invariants
- equivalent authority-scoped requests share one inflight future
- inflight entries are removed on settle
- rejection does not permanently poison future retries unless explicit policy says so
- settled positive results may alias only through proven-safe equivalence
- negative results are stored only by explicit policy, not by accident

## Why this is the right order
If we normalize first but do not coalesce in-flight work, concurrent duplicate misses can still explode.
If we coalesce first but never normalize/alias, equivalent requests can still miss under different spellings.

So the elegant order is:
1. introduce single-flight at the existing truthful request boundary
2. then tighten canonicalization and alias collapse around it
3. only then consider same-session negative caching if evidence still demands it

## Candidate interventions
### A. Build a tiny resolver memo object first
Do not smear policy through `u.resolve.ts` as ad hoc `Map` mutations.
Create one small seam that conceptually owns:
- `lookup(request)`
- `getInflight(request)`
- `begin(request, promise)`
- `settle(request, result)`
- `alias(aliasKey, requestKey)`
- optional negative storage by explicit policy

### B. Add session-local single-flight around `resolveDenoWith(...)`
This should be the first code move.

### C. Extract canonicalization into pure helpers
Do not scatter string surgery across the resolver.
Create small pure helpers for:
- canonical remote URL normalization
- file URL/path normalization
- safe specifier alias derivation

### D. Alias successful results aggressively but truthfully
After a successful resolve, store the result under all proven-equivalent names.

### E. Only then consider negative session caching
If repeated misses/external results are still observed after single-flight plus alias normalization, store them for the lifetime of the dev server.
Do not turn this into persistent state yet.

## Constraints
- do not collapse distinct authority worlds
- do not erase cwd/root distinctions without proof
- do not assume importer differences are irrelevant unless measured
- do not canonicalize beyond what the URL/specifier rules guarantee
- do not add negative caching just because caches seem attractive

## Acceptance
- repeated resolve count drops materially on the same local run
- inflight-hit counts appear where duplicate misses previously existed
- cumulative resolve total drops materially
- `dev.parent.total` or first-entry timings improve measurably
- no correctness regressions in targeted dev/build proof lanes

---

# Engineering shape for the implementation

## Prefer a small resolver memo object over ad hoc map mutations
Instead of sprinkling new `Map` lookups throughout `u.resolve.ts`, create a tiny helper seam, for example conceptually:
- `ResolverMemo.getOrResolve(...)`
- `ResolverMemo.alias(...)`
- `ResolverMemo.store(...)`
- `ResolverMemo.lookup(...)`

This keeps the I/O edge thin and makes the policy testable.

## Keep normalization pure
Canonicalization helpers should be pure string/URL/path functions with direct unit tests.
Do not bury them inside subprocess branches.

## Keep authority separate from canonical identity
A canonical URL is not the same thing as a universally safe cache key.
The request key must still include any authority dimension that changes truth.

## Do not jump to persistent cache yet
Persistent caches add invalidation burden.
The current highest-confidence win is still within one dev server session.
Earn that first.

---

# Test strategy

## Principle
Build on existing resolver/plugin tests and existing perf instrumentation.
Do not invent a new giant harness before using the proof surfaces already in the package.

## Layer 1 — pure unit tests for canonicalization helpers
Add tests for small pure helpers such as:
- canonical remote URL normalization
- file/path normalization
- alias derivation from redirected/module/local outputs

### Must prove
- equivalent remote spellings collapse where truly safe
- non-equivalent spellings remain distinct
- path normalization remains platform-stable

## Layer 2 — resolver unit tests for single-flight behavior
Extend `src/m.vite.transport/-test/-u.resolve.test.ts` with stubbed `invoke(...)` counters.

### Must prove
- concurrent identical requests trigger exactly one subprocess invoke
- concurrent alias-equivalent requests trigger exactly one subprocess invoke after canonicalization
- redirected results are aliased for later lookup
- repeated unresolved/external lookups do not respawn work if negative caching is adopted
- authority distinctions that must remain distinct still do remain distinct

This is the most important deterministic proof layer.

## Layer 3 — plugin/integration tests for parent/child hydration reuse
Use the existing resolver/plugin tests to prove:
- repeated remote parent hydration collapses correctly
- repeated remote child hydration collapses correctly
- cached importer dependency graphs are reused instead of rehydrated needlessly

## Layer 4 — perf-counter proof, not benchmark theater
Reuse the current perf instrumentation to compare before/after in one narrow local world.

### Required evidence
- lower `transport.resolveDeno count`
- lower `transport.resolveDeno total`
- appearance of inflight/alias hits if instrumented
- no regression in ready/entry behavior

## Layer 5 — truthful outside-in confirmation
After the local packet is green:
- run the same local `ui-react-components` world again
- if justified, run one real external call-site world

The outside-in world is the correction factor, not the first debugging loop.

---

# Separate follow-up packet — `sys:npm-prewarm` breadth

`sys:npm-prewarm` narrowing is a separate packet after Packet A remeasurement.
It is intentionally out of scope for this implementation slice.

## Why separate it
- Packet A should optimize one resolver invariant at a time
- prewarm breadth is a different owner policy question
- combining them in one patch would blur semantic proof and performance proof

## Follow-up doctrine
When opened, that packet should start from:
- startup-critical subset first
- then defer/background non-critical warm work if still useful
- only then consider bounded concurrency

---

# Surgical implementation checklist

## Files
- `src/m.vite.transport/u.resolve.ts`
- `src/m.vite.transport/t.internal.ts`
- `src/m.vite.transport/-test/-u.resolve.test.ts`

## Mandatory sequencing
1. add or extend failing deterministic tests for concurrent identical requests
2. add the smallest resolver-memo seam needed for session-local reuse
3. implement single-flight around `resolveDenoWith(...)` only
4. remeasure the same local world
5. add or extend failing deterministic tests for alias-equivalent requests
6. implement canonical request/alias normalization only where proven safe
7. remeasure again
8. only if measurement still proves repeated same-session misses/external churn, add negative caching
9. remeasure again
10. stop

## Explicit deferrals
- persistent cross-restart cache
- `sys:npm-prewarm` narrowing in the same code slice
- `dev.warmup`
- `optimizeDeps.include`
- transform strategy redesign

## Done criteria for Packet A
- concurrent equivalent resolve requests collapse to one subprocess call
- inflight entries are removed correctly on settle
- rejected inflight work does not poison future legitimate retries unintentionally
- alias-equivalent requests reuse settled truth where safe
- `transport.resolveDeno` count drops materially in the same local proof world
- no regressions in targeted transport/dev proof lanes

---

# Implementation eval protocol

## Purpose
Make each implementation step earn its keep through stronger semantics and clearer measured effect.

This lane should not be judged by feel, elegance alone, or one lucky timing anecdote.
Each step must answer:
- what invariant became stronger?
- what measured cost became smaller?
- what truth boundary remained unchanged?

## Required proof layers
### Layer 1 — deterministic semantic proof
Use targeted transport tests first, especially:
- `src/m.vite.transport/-test/-u.resolve.test.ts`

These tests must prove the semantic claim of the current step before perf claims matter.

### Layer 2 — narrow local perf proof
Use the same local proof world for before/after comparison:
- `code/sys.ui/ui-react-components`

Primary metrics:
- `transport.resolveDeno count`
- `transport.resolveDeno total`
- `config.npmPrewarm elapsed` when relevant
- `dev.parent.total`

### Layer 3 — outside-in correction factor
After a local win is established, confirm with one real outside-in world.
This is a correction factor, not the first debugging loop.

## Per-step evaluation cadence
For each implementation substep:
1. add or extend failing targeted tests first
2. implement one semantic move only
3. run targeted transport tests
4. rerun the same narrow local perf world
5. compare before/after metrics
6. decide whether to continue, simplify, or stop

This sequencing is mandatory for Packet A, not advisory.
## Step-specific evaluation rules
### Single-flight
Must prove:
- concurrent equivalent resolve requests collapse to one subprocess call
- rejection/cleanup behavior stays correct
- later equivalent callers observe the shared result, not duplicated work

Expected perf effect:
- lower `transport.resolveDeno count`
- visible inflight-hit reuse if instrumented
- some reduction in cumulative resolve total

### Canonical / alias normalization
Must prove:
- only semantically equivalent requests collapse
- redirected ids alias to the same settled truth where safe
- importer/cwd distinctions that change truth are preserved

Expected perf effect:
- fewer duplicate later resolves beyond literal same-string matches
- reduced repeated parent/child graph hydration

### Negative caching
Only proceed if measurement shows repeated same-session misses/external outcomes that survive single-flight plus alias normalization.

Must prove:
- repeated equivalent misses do not respawn subprocess work
- integrity-failure behavior is preserved
- distinct requests are not accidentally suppressed

If that proof is absent, do not add negative caching in Packet A.
### npm prewarm narrowing
Out of scope for Packet A.
This rule applies only when the separate prewarm packet is opened later.

Must prove:
- startup-critical npm deps still behave correctly
- reduced pre-ready work does not merely reappear as worse first-entry cost

Expected perf effect:
- lower `config.npmPrewarm elapsed`
- lower `dev.parent.total`
- no unacceptable first-entry regression

## Promotion criteria
A substep is worth keeping only if:
- semantic proof is stronger or equally strong
- measured cost improves materially enough to matter
- no published-boundary correctness claim is weakened

If semantics improve but perf does not, keep the semantic cleanup only if it clearly simplifies the next measured step.
Otherwise stop and reassess.

## False wins to reject
- lower cumulative totals with no meaningful startup/user-visible improvement
- faster ready time with worse first-entry behavior
- prettier local fixture numbers with no outside-in transfer
- fewer resolves caused by weakened correctness or over-collapsed authority distinctions
- lower startup time achieved only by pushing the same pain later without net gain

## Timeless optimization order
Stay in this order unless evidence forces a change:
1. eliminate duplicate work
2. canonicalize equivalent work
3. memoize truthful results
4. narrow unnecessary broad work
5. only then parallelize more broadly or redesign architecture

This order is the anti-theater posture for this lane.

---

# Stop conditions
Stop and re-plan if any of these become true:
- repeated resolve work is mostly legitimate and not materially reducible by single-flight/alias fixes
- the resolve fix improves counts but not startup meaningfully
- canonicalization risks collapsing distinct authority worlds
- outside-in call-site runs contradict the local ranking strongly enough to change priority
- implementation complexity rises faster than measured gain

---

# Success criteria
## Success A
Single-flight + alias-safe normalization materially reduces repeated subprocess work and improves startup.

## Success B
Resolve reuse improves materially, and npm prewarm becomes the next clear startup-visible tax.

## Success C
Both help somewhat, but the remaining dominant owner seam is deeper transport architecture, justifying a later redesign lane.

Any of these outcomes is useful and truthful.

---

# Final STIER recommendation
Yes: this should become the next implementation packet.

But it should be expressed as a **resolver reuse correctness packet with measured payoff**.

Packet A:
1. **single-flight resolve reuse**
2. **canonical request/alias normalization**
3. **optional same-session negative caching only if measurement still proves it necessary**
4. **remeasure**
5. **stop**

Packet B, separately:
- **narrow `sys:npm-prewarm` breadth**

Packet C, only if still warranted later:
- **Vite-native warmup/deps tuning**
