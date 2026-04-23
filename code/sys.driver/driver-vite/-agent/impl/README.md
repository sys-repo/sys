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
- Packet E has now landed its narrow resolve-identity fix.
- Outside-in proof-world validation now shows:
  - transform cache hits are still real
  - malformed `https:/...` remote request identity no longer appears in the traced resolve lane
  - malformed wrapped remote importer vocabulary no longer appears in the traced browser/dev path
  - equivalent malformed/canonical concrete remote spellings now collapse before duplicated expensive resolve work is paid

## Current implementation posture
The active Packet E implementation lane is complete.
The perf fix stayed narrow:
- one shared concrete-remote authority-delimiter repair helper
- resolver lookup-key collapse before expensive resolve work
- wrapped-id writer cleanup across resolve/specifier/load boundaries
- targeted deterministic tests plus proof-world remeasurement

A new narrow Packet C is now opened for the Vite dep-optimizer seam:
- canonical `optimizeDeps` surface exposure in `Vite.Config.app(...)`
- no heuristic driver defaults
- no call-site tuning mixed into the packet

The next move is therefore not more Packet E widening.
Only follow-up seams proven after this point should open a new narrow packet.

## Step 2 tracing flag
Use a dedicated env-gated trace flag for Packet E audit work:
- `SYS_DRIVER_VITE_TRACE_RESOLVE=1`

This trace should stay:
- narrow
- provenance-oriented
- removable after findings are recorded
