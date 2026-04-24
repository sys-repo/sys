# Current truth: call-site cache state after Packet D

## Status
Historical outside-in truth note retained as a pre-authority snapshot.
No implementation in this note.

## Important scope boundary
This note records the call-site state before the later authority/cache work landed.
It should now be read as input context, not as the live next-step packet.
Later landed work now exists for:
- consumer-local Vite `cacheDir`
- optimize-deps authority audit
- React/npm authority convergence for workspace consumers

The current next move after this historical snapshot is remeasurement, not re-opening the authority plan as if it were still untouched.

## Scope
This note captures the post-Packet-D call-site reality at:
- `/Users/phil/code/-people/rowanyeoman-dev/agent-projects/code/projects/slc-data`

Observed Vite cache area:
- `/Users/phil/code/-people/rowanyeoman-dev/agent-projects/node_modules/.vite`

Observed driver transport cache area:
- `/Users/phil/code/-people/rowanyeoman-dev/agent-projects/node_modules/.vite/.sys-driver-vite/transport`

## What is now proven
### 1. Packet D is writing cache entries in the intended place
The driver-owned transport cache exists under Vite cache ownership, not in ad hoc repo-local scratch space.

That means the landed cache placement doctrine is now proven at a real outside-in call site.

### 2. Packet D is reusing cache entries on follow-up dev start
Observed follow-up logs include both:
- `transport.transform.cache.hit`
- `transport.loadDenoModule ... cache="hit"`

Representative shape:
- cache hit on `https://jsr.io/@sys/net/0.0.113/src/common/mod.ts`
- cache hit on `https://jsr.io/@sys/net/0.0.113/src/pkg.ts`
- cache hit on `https://jsr.io/@sys/net/0.0.113/src/common/libs.ts`

Observed cache-hit load latencies are materially cheap, for example:
- `elapsed=1`
- `elapsed=2`
- `elapsed=5`

That means the transform cache is not merely writing files; it is paying off on reuse.

### 3. Packet D did not solve the whole fresh-start problem
The same follow-up outside-in run still showed extremely high resolve activity, including:
- `transport.resolveDeno count=983`
- `transport.resolveDeno total=1591571`

This cumulative total is not a wall-clock duration claim, but it is still far too large to ignore.

The current cold-start story is therefore:
- transform reuse improved
- transform cache hits are real
- resolve churn still dominates

## What is still red
### 1. Equivalent remote identities are still alive in multiple forms
The outside-in logs still show both:
- `https://jsr.io/...`
- `https:/jsr.io/...`

Example family observed in one follow-up run:
- `https://jsr.io/@sys/net/0.0.113/src/common/libs.ts`
- `https:/jsr.io/@sys/net/0.0.113/src/common/libs.ts`

This matters because it strongly suggests the resolve lane still allows identity fragmentation before reuse fully collapses it.

### 2. Single-flight helps, but request volume is still ugly
Repeated lines such as:
- `transport.resolveDeno.inflight id="https:/jsr.io/@sys/net/0.0.113/src/common/libs.ts"`

show that inflight coalescing is active.
That is good.

But the fact that many callers still pile onto the same malformed/equivalent identity means:
- single-flight alone was not enough
- canonical request identity is still too weak or too late at the current call site

### 3. Settled reuse is active, but not enough to remove the hotspot
The logs also show many `transport.resolveDeno.settled` hits for `jsr:@sys/std@^0.0.341/*` leaves.
That means settled reuse is working.

Even so, the cumulative resolve burden remains dominant.
So the current outside-in truth is not "cache failed".
It is:
- transform cache succeeded narrowly
- resolve reuse is still the next dominant owner seam

## What this note does NOT prove
### 1. It does not prove Vite dep optimizer behavior is fixed
Logs such as:
- `new dependencies optimized: ...`

belong to Vite's dep optimizer lane, not the driver transport transform cache lane.

Do not read Vite optimizer churn as evidence that Packet D failed.
Do read them as evidence for a separate cache-authority / dep-optimizer lane.

That lane should now be split into two fault classes:
- Class 1: cross-start optimizer invalidation (for example `Re-optimizing dependencies because vite config has changed`)
- Class 2: same-session late dependency discovery (for example `optimized dependencies changed. reloading`)

The first class points primarily at cache authority / metadata provenance.
The second class points primarily at optimizer breadth and request-time discovery.

### 2. It does not prove follow-up `deno task dev` should now feel near-instant
Packet D only removed one specific class of repeated work:
- browser-ready transform of remote immutable transported modules

It did not remove:
- resolve subprocess cost
- npm prewarm breadth
- app graph breadth
- Vite dep optimizer work
- all startup/config work

So "not near-instant yet" is compatible with Packet D succeeding.

### 3. It does not yet prove that persistent resolve cache is the next correct move
The current signal is strong enough to reopen the resolve lane.
It is not yet strong enough to jump straight to a broader persistent resolve cache design.

The first next move should still be a hard audit of current request-key truth at the outside-in call site.

## BMIND conclusion
Packet D landed successfully and is now proven at a real call site.
The driver-owned transform cache:
- writes to the right place
- reads from the right place
- and materially cheapens transform reuse on follow-up dev start

That is real progress.

However, the dominant remaining pain is now clearer than before:
- repeated and fragmented `transport.resolveDeno` work

The current state is therefore better described as:
- transform-side cache win confirmed
- resolve-side identity/reuse still hot

## TMIND conclusion
The most actionable signal in the current logs is not "cache miss".
It is the continued coexistence of:
- `https://jsr.io/...`
- `https:/jsr.io/...`

inside the resolve lane, plus the very high cumulative `transport.resolveDeno` burden.

That combination is exactly the kind of signature expected when:
- request-key normalization is still incomplete
- alias collapse is still too late
- or parent/child graph hydration continues to ask for semantically equivalent work under split identities

## STIER recommendation
Do not reopen transform caching first.
Do not broaden Packet D.
Do not treat app-local optimizer include lists as the first proof move.

The historical next passes described in this note have now materially moved into landed code/tests:
1. Packet E handled resolve-key fragmentation for malformed/canonical remote identities.
2. The later authority/cache lane landed consumer-local cache authority plus React/npm authority convergence work.

Therefore the current next move is:
3. remeasure the real proof worlds after those landed changes
4. classify any remaining residue before choosing the next packet
5. only then treat app-local `optimizeDeps` tuning as the next move for residual Class 2 churn if the measurements still justify it

Low-priority residue seen in the same logs:
- repeated `/sw.js` misses redirected to `file:///sw.js`

That should not be treated as the main owner seam unless later proof says otherwise.
