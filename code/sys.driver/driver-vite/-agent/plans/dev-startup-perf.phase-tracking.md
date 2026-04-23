# Tracking: `driver-vite` resolve reuse implementation phases

## Purpose
Human/LLM tracking note for Packet A execution.

The collaboration model is:
- LLM implements one narrow phase at a time
- human reviews at semantic/perf decision gates
- stop after each phase and decide whether to continue

## Packet A — resolver reuse correctness with measured payoff

### Phase A1 — single-flight only
#### Scope
- deterministic tests for concurrent identical requests
- smallest resolver-memo seam
- single-flight around `resolveDenoWith(...)`
- local remeasure
- stop

#### Files
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/t.internal.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.resolve.test.ts`

#### Must prove
- concurrent equivalent requests share one subprocess call
- inflight entries are removed on settle
- rejected inflight work does not poison future legitimate retries

#### Checkpoint output
- summary of code changes
- tests added/updated
- targeted test results
- before/after local perf lines
- recommendation: stop or continue

#### Commit
`feat(driver-vite): add session-local resolve single-flight`

---

### Phase A2 — alias-safe normalization only
#### Scope
- deterministic tests for alias-equivalent requests
- pure canonicalization helpers
- alias settled truth under proven-safe equivalent names
- local remeasure
- stop

#### Files
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/t.internal.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.resolve.test.ts`

#### Must prove
- only semantically equivalent requests collapse
- redirected/equivalent forms reuse settled truth
- authority distinctions remain intact

#### Checkpoint output
- exact equivalence rules added
- tests added/updated
- targeted test results
- before/after local perf lines
- recommendation: stop or continue

#### Commit
`feat(driver-vite): reuse aliased resolve results safely`

---

### Phase A3 — negative caching only if still justified
#### Scope
- only if logs/tests still show repeated same-session miss/external churn
- deterministic tests for repeated misses
- add same-session negative caching
- local remeasure
- stop

#### Files
- same three transport files, only if needed

#### Must prove
- repeated equivalent misses do not respawn subprocess work
- integrity failures still behave correctly
- distinct requests are not suppressed accidentally

#### Checkpoint output
- evidence that Phase A3 was actually needed
- tests added/updated
- targeted test results
- before/after local perf lines
- recommendation: stop Packet A

#### Commit
`feat(driver-vite): cache repeated resolve misses within session`

If not needed:
- no Phase A3
- no commit
- Packet A stops after A2

---

## After Packet A
### Human decision gate
Decide whether to open:

#### Packet B — npm prewarm breadth
Suggested later commit:
`perf(driver-vite): narrow npm prewarm to startup-critical deps`

#### Packet C — Vite-native levers, only if still warranted
Suggested later commit:
`perf(driver-vite): add narrow dev warmup and deps optimization`

---

## Expected checkpoint return from LLM each phase
1. what changed
2. what was tested
3. what the numbers did
4. whether the invariant got stronger
5. whether we should stop or continue

---

## Flat tracking list
- [ ] A1 single-flight
- [ ] A2 alias-safe normalization
- [ ] A3 negative caching only if justified
- [ ] B npm prewarm breadth
- [ ] C Vite-native levers if still needed
