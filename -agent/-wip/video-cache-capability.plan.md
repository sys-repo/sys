# Video Cache Capability Plan (Phased)

## Goal
Add a policy-driven media cache capability to `Http.Cache.pkg` that prevents cache poisoning, preserves current safe behavior by default, and enables bounded range-chunk caching for large media as an opt-in mode.

## Scope
- Target module: `/Users/phil/code/org.sys/sys/code/sys/http/src/http.client/m.HttpCache`
- Keep existing hashed asset cache behavior unchanged.
- Evolve media behavior in phases with strict safety invariants.

## Non-Negotiable Invariants
1. Never cache partial/ambiguous media as full object.
2. Never synthesize range responses from uncertain bytes.
3. Media cache always bounded (per object + global).
4. Unsafe cases must fall back to network pass-through.
5. Asset cache semantics remain unchanged.

## Phase 1: Policy Surface + Strategy Split (No Behavior Change)
### Deliverables
1. Add media policy config surface:
- `media.mode: 'off' | 'safe-full' | 'range-window'`
- limits fields introduced but only fully consumed later.
2. Refactor `m.Cache.pkg.ts` into internal strategy routing:
- `mediaOffResponse`
- `mediaSafeFullResponse`
- placeholder wiring for `mediaRangeWindowResponse`.
3. Preserve default behavior as current hardened `safe-full`.

### Safety Gates
1. Existing `safe-full` tests pass.
2. No change to asset cache tests/behavior.
3. Functional parity with current live fix.

### Exit Criteria
- Mode routing exists and default mode is `safe-full`.
- No production behavior regression.

## Phase 2: Range-Window Mode (Bounded 206 Chunk Cache)
### Deliverables
1. Implement `range-window` strategy with strict chunk semantics:
- Cache keys: `url + start + end`.
- Serve only exact or safely sliceable cached coverage.
- Network pass-through on gaps/invalid ranges.
2. Enforce budgets:
- `maxChunkBytes`
- `maxObjectBytes`
- `maxTotalBytes`
- `ttlMs`.
3. Add eviction:
- TTL sweep first.
- LRU eviction until under budget.

### Safety Gates
1. New tests for exact-hit/miss and invalid ranges.
2. New tests for TTL/LRU eviction and stale index recovery.
3. Concurrency tests for simultaneous range requests.

### Exit Criteria
- `range-window` mode is opt-in and stable under budget pressure.
- No invariant violations in tests.

## Phase 3: Commands + Observability + Rollout Controls
### Deliverables
1. Extend cache command reporting for media:
- bytes used
- chunk count
- hit/miss
- evictions
- skip reasons.
2. Extend clear scope support:
- scoped media clear (`assets` vs `media`), docid scope if practical.
3. Add rollout toggles and defaults guidance.

### Safety Gates
1. Command contract tests updated.
2. Metrics sanity tests for counters.
3. Manual live verification checklist for SW + reload behavior.

### Exit Criteria
- Operators can inspect and clear media cache predictably.
- Sufficient telemetry exists for cost/performance tuning.

## Adversarial Checklist (Apply in Every Phase)
1. 206 status masquerading as full object.
2. Misleading/missing `Content-Length`.
3. Malformed/partial `Content-Range`.
4. Range requests outside known bounds.
5. Stale metadata entries after cache eviction.
6. Concurrent writes racing on same URL/range.

## Recommended Rollout Sequence
1. Implement and ship Phase 1.
2. Implement Phase 2 behind explicit opt-in.
3. Turn on `range-window` in controlled environment only.
4. Implement Phase 3 to expose real metrics before broad rollout.

## Definition of Done (Program Level)
1. No replay of the "reload won't play" failure class.
2. Deterministic media cache behavior under all tested conditions.
3. Bounded storage for large media.
4. Clear visibility into cache behavior and tuning signals.
