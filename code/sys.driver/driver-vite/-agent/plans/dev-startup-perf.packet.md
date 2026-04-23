# Packet: `driver-vite` dev startup performance — first truthful optimization lane

## Depends on
- `./driver-vite-dev-startup-perf.0.review.md`

## Goal
Create a small, truthful optimization packet that improves real cold dev startup / first-load performance without compromising the published-boundary architecture.

## Non-goals
- no broad refactor of transport architecture yet
- no fake local-source alias privilege
- no broad workspace/graph redesign
- no call-site app refactors in this packet
- no benchmark theater without phase timing

---

# Packet doctrine
This packet should answer:

1. where time is actually going,
2. whether Vite-native warmup/deps optimization gives easy wins,
3. whether npm prewarm is too broad,
4. whether the later bigger transport lanes are justified.

If this packet does not materially improve cold start, that is still useful truth.
It then justifies the deeper transport lane.

---

# Scope
## In scope
- `code/sys.driver/driver-vite/src/m.vite/*`
- `code/sys.driver/driver-vite/src/m.vite.config/*`
- `code/sys.driver/driver-vite/src/m.vite.transport/*`
- perf harness / targeted perf probes as needed

## Out of scope for this packet
- `agent-projects` app graph cleanup
- broad `@sys/std` / package-surface slimming
- transport persistent cache implementation
- transform-service redesign

---

# Phase 0 — measurement first

## Objective
Instrument the cold dev path so we stop reasoning from feel alone.

## Add timings around
### Driver startup
- `Wrangle.command(...)`
- `Bootstrap.create(...)`
- `createProjection(...)`
- `createDelivery(...)`
- `Wrangle.pathsFromConfigfile(...)`
- `Vite.Config.app(...)`

### Plugin startup work
- imports-map load in `createSpecifierRewrite(...)`
- npm prewarm count + elapsed in `createNpmPrewarm(...)`
- optimize-import rule derivation elapsed
- workspace alias derivation elapsed

### Transport work
- count + elapsed of `resolveDenoWith(...)`
- count + elapsed of `loadDenoModule(...)`
- count + elapsed split by loader (`ts`, `tsx`, `js`, etc)
- count + elapsed of CLI transform path

### User-visible milestones
- process spawned
- ready signal seen
- `/` HTML 200
- entry module 200
- first immediate imported modules 200

## Output shape
Prefer a narrow dev perf artifact, for example under:
- `code/sys.driver/driver-vite/.tmp/perf/`

It should be readable enough to answer:
- what phase dominates cold start?
- what is materially different between cold and warm?

---

# Evidence update after first local instrumentation run

A local `ui-react-components` dev run produced three important truths:

1. `transport.resolveDeno` is the dominant measured driver-owned hot seam so far.
   - sample signal: `count=161`, `total=65142` cumulative resolve time
   - repeated equivalent `@std/*` targets were resolved many times
   - inconsistent-looking specifier shapes (`https://...` and `https:/...`) appeared in the same run
2. `sys:npm-prewarm` is a real startup tax.
   - sample signal: `specifiers=82`, `elapsed=1634`
3. workspace/config assembly is comparatively cheap.
   - sample signal: `config.workspace≈9ms`, `config.app≈25ms`

This changes the first execution ranking:
- resolution reuse/normalization is now the highest-priority deeper lane,
- npm prewarm narrowing is now justified as a shallow follow-up,
- CLI transform redesign remains relevant but no longer looks first in the current local proof.

---

# Phase 1 — immediate follow-up after instrumentation

## Objective
Exploit the first measured truths before broad new tuning.

## Candidate A — inspect and reduce repeated `resolveDenoWith(...)` work
### Why
The first local run strongly suggests repeated subprocess resolution is the largest driver-owned cost center.

### Trial
- inspect cache-key normalization and equivalent-specifier duplication
- explain repeated resolution of the same `@std/*` targets
- investigate malformed/variant specifier shapes such as:
  - `https://jsr.io/...`
  - `https:/jsr.io/...`
- improve reuse before redesigning transport wholesale

### Acceptance
- repeated resolve counts drop materially
- cumulative resolve time drops materially
- no published-boundary truth drift

## Candidate B — narrow `sys:npm-prewarm`
### Why
The first local run measured prewarm as a real startup tax (~`1634ms`) over `82` specifiers.

### Trial
- warm only app/config-reachable npm deps
- or skip clearly irrelevant authority-wide npm imports
- or move non-critical warming out of the pre-ready window

### Acceptance
- startup ready time drops materially
- no dependency authority lies
- no correctness drift

---

# Phase 2 — Vite-native easy wins

## Objective
Try the cheapest upstream-aligned optimizations after the first measured resolution/prewarm follow-up.

## Candidate A — `dev.warmup`
### Why
Vite 8 supports explicit dev warmup and defaults to no warmup.
This is a low-risk way to improve perceived startup.

### Trial
In `Vite.Config.app(...)`, evaluate warming:
- the HTML entry
- the JS/TS entry
- possibly the splash/default entry world only

### Acceptance
- no correctness drift
- measurable improvement in time-to-first-entry-served or time-to-first-render

## Candidate B — explicit `optimizeDeps.include`
### Why
Vite source explicitly recommends this to improve cold start.

### Trial
Start with the obvious hot npm deps:
- `react`
- `react-dom`
- `react-dom/client`

If justified by real call-site traces, extend to a tiny known hot set.

### Constraint
Do not include broad speculative lists.
Prefer real observed entry-reachable npm deps.

### Acceptance
- lower cold-start / first-load time
- no integrity drift
- no broad false-positive dep optimization surface

---

# Phase 2 — narrow prewarm breadth

## Objective
Reduce startup-coupled warming that is truthful but broader than necessary.

## Current concern
`sys:npm-prewarm` currently warms npm targets derived from authoritative imports broadly, not from actual app-reachable need.

## Candidate strategies
1. prewarm only npm targets reachable from config + app entry
2. skip npm targets already materialized/resolved
3. parallelize prewarm with bounded concurrency
4. move non-critical warming out of the critical startup window

## Acceptance
- startup work narrows measurably
- no published-boundary truth drift
- no dependency authority lies

---

# Decision gate after Phase 0–2

If the combined result gives a real win, stop and keep the larger transport redesign deferred.

If the result is small or negligible, escalate to the deeper transport lane.

---

# Phase 3 — deeper lane trigger (not this packet)

Escalate only if Phase 0–2 shows transport dominates and simple levers are insufficient.

## Next-lane candidates
### A. Transform strategy redesign
Replace per-module esbuild CLI spawn with one of:
- persistent transformer service
- pooled worker/process
- JS API fast path with correct binary ownership
- CLI fallback only

### B. Resolution reuse
Reduce repeated subprocess `deno info --json` cost via:
- persistent resolved metadata cache
- broader graph hydration per root
- or fewer subprocess calls by design

### C. Driver-owned persistent transport cache
Cache transformed browser-ready module outputs under a driver-owned cache dir keyed by:
- resolved target
- loader
- source identity
- rewrite/dependency identity

---

# Suggested first execution packet

## Packet A
1. add instrumentation
2. add a narrow dev perf script or targeted test harness
3. measure a real local call-site world cold + warm
4. add `dev.warmup`
5. add minimal `optimizeDeps.include`
6. remeasure
7. narrow `sys:npm-prewarm` only if measurements show it matters

## Stop conditions
- if instrumentation already shows transport transform dominates overwhelmingly, stop before over-tuning warmup/prewarm and move to the deeper lane
- if warmup + optimizeDeps gives a meaningful win, stop and bank it
- if call-site app imports dominate the result, document that separately instead of blaming the driver

---

# Success criteria
A good first packet should produce one of these truthful outcomes:

## Success A
"Cold dev startup improved materially via Vite-native warmup/deps tuning, no architecture changes needed yet."

## Success B
"Measured cold-start cost is dominated by transport transform/resolution, justifying a dedicated deep transport optimization lane."

## Success C
"Driver startup is acceptable; call-site app graph breadth dominates perceived slowness."

Any of those is a useful outcome.

---

# Notes for later call-site follow-up
Outside this packet, `slc-data` should likely be reviewed for default splash path weight, especially:
- `src/-test/entry.splash.tsx`
- `@sys/ui-react-devharness` in the non-rich splash path

That is a separate app-owned optimization lane, not a driver-vite packet.
