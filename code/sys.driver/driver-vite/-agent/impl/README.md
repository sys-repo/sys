# `impl/` — decision-grade operational truth for the active perf lane

This folder is the isolated review/execution unit for the current `driver-vite`
dev-startup performance lane.

## Read order
1. `./dev-startup-perf.callsite-cache-truth.md`
2. `./dev-startup-perf.resolve-key-audit.packet.md`
3. `./dev-startup-perf.resolve-key-audit.findings.md`
4. `./dev-startup-perf.resolve-identity-fix.packet.md`

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
- Outside-in call-site truth now shows:
  - transform cache hits are real
  - transform-hit latency is cheap
  - `transport.resolveDeno` remains the dominant hot seam
  - equivalent remote identities still appear split as both `https://...` and `https:/...`

## Current implementation posture
The next move is not to broaden transform caching.
The audit and findings are complete.
The active move is now the smallest truthful first identity-boundary fix for equivalent malformed/canonical remote resolve identities.

The active lane is therefore:
- provenance audit complete
- confirm where malformed `https:/...` ids are first written
- land one narrow fix packet covering causal source + early expensive-boundary collapse
- stop if implementation pressure would broaden the packet boundary

## Step 2 tracing flag
Use a dedicated env-gated trace flag for Packet E audit work:
- `SYS_DRIVER_VITE_TRACE_RESOLVE=1`

This trace should stay:
- narrow
- provenance-oriented
- removable after findings are recorded
