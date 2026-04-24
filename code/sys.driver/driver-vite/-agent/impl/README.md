# `impl/` — decision-grade operational truth for the active perf lane

This folder is the isolated review/execution unit for the current `driver-vite`
dev-startup performance lane.

## Read order
1. `./dev-startup-perf.callsite-cache-truth.md`
2. `./dev-startup-perf.resolve-key-audit.packet.md`
3. `./dev-startup-perf.resolve-key-audit.findings.md`
4. `./dev-startup-perf.resolve-identity-fix.packet.md`
5. `./dev-startup-perf.packet-c.optimize-deps-surface.packet.md`

Optional next-lane candidate only if reopened after publish validation:
- `./dev-startup-perf.negative-miss-suppression.candidate.md`

## Purpose
Use this folder for:
- current outside-in truth
- the active implementation packet
- decision-grade operational notes that can overturn earlier packet ranking without reopening all historical context
- narrow reviewable execution thinking

Do not use this folder for broader historical packet lineage or deeper TMIND research.

## Historical / research context
- historical packet notes: `../plans/`
- TMIND research stack: `../tmind/dev-startup-perf/`

## Current state summary
- Packet A landed as session-local resolve reuse.
- Packet D landed as persistent dev-only transport transform cache under Vite cache ownership.
- Packet E landed its narrow resolve-identity fix.
- The Vite optimizer/cache authority lane has now also materially landed:
  - consumer-local `cacheDir`
  - optimize-deps authority audit seam
  - React/npm authority convergence for workspace consumers
  - fixture-based authority regression coverage
- Packet C also landed as a narrow keeper:
  - canonical `optimizeDeps` surface exposure in `Vite.Config.app(...)`
  - no heuristic driver defaults

## Current implementation posture
The earlier Packet E implementation lane is complete.
The perf fix stayed narrow:
- one shared concrete-remote authority-delimiter repair helper
- resolver lookup-key collapse before expensive resolve work
- wrapped-id writer cleanup across resolve/specifier/load boundaries
- targeted deterministic tests plus proof-world remeasurement

The later authority/cache lane has now moved from plan to landed code/tests.
Current startup evidence should still be classified as two fault classes:
- Class 1: cross-start optimizer invalidation
- Class 2: same-session late dependency discovery

The current next block was therefore:
- remeasure the real proof worlds after the landed authority/cache changes
- confirm whether Class 1 materially dropped
- confirm whether the React identity split / duplicate wrapper failure is gone
- classify any remaining residue truthfully before opening any new packet

That proof step has now been exercised in `@sys/ui-react-components` on a fresh local cold start.
Observed result:
- consumer-local Vite cache was created under `code/sys.ui/ui-react-components/node_modules/.vite`
- consumer-local optimizer metadata was created under `node_modules/.vite/deps/_metadata.json`
- the React optimize graph collapsed to one wrapper: `react.js`
- `react-dom`, `react-dom/client`, and `react-inspector` all consumed `react.js`
- `DepAudit.reactSingletons(...)` reported:
  - `mixedAuthority: false`
  - `duplicateWrapper: false`
  - `divergentConsumers: false`

This is a real authority-convergence proof win for that world.
It is not yet a universal startup win claim and it does not close the separate intermittent `vite:oxc` / `TsconfigCache` cold-start seam.

Packet C remains a landed keeper, but not the current lead.
If residual Class 2 churn remains after broader remeasurement:
- use the Packet C surface truthfully at the call site
- do not widen into driver default include lists
- do not add `dev.warmup`

The next move is therefore not more Packet E widening and not more speculative authority planning.
Only follow-up seams proven after remeasurement should open a new narrow packet.

## Step 2 tracing flag
Use a dedicated env-gated trace flag for Packet E audit work:
- `SYS_DRIVER_VITE_TRACE_RESOLVE=1`

This trace should stay:
- narrow
- provenance-oriented
- removable after findings are recorded
