# `impl/` — active implementation-facing perf lane

This folder is the isolated review/execution unit for the current `driver-vite`
dev-startup performance lane.

## Read order
1. `./dev-startup-perf.callsite-cache-truth.md`
2. `./dev-startup-perf.resolve-key-audit.packet.md`
3. `./dev-startup-perf.resolve-key-audit.findings.md` once the audit checkpoint exists

## Purpose
Use this folder for:
- current outside-in truth
- next implementation packet
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
The next move is to audit resolve-key truth at the real call site, classify the exact fault before coding, and derive the smallest truthful normalization / alias-collapse implementation packet.
