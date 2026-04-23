# Packet E findings checkpoint: resolve provenance audit

## Status
Checkpoint template only.
Fill this note after the audit and before any Packet E implementation change.

## Purpose
This note is the pre-implementation gate for Packet E.
Do not start implementation until the audit findings are written here and reviewed.

## Inputs
- `./dev-startup-perf.callsite-cache-truth.md`
- `./dev-startup-perf.resolve-key-audit.packet.md`

## Required contents
### 1. Representative trace used
- call-site world:
- command / scenario:
- date:
- trace knobs enabled:

### 2. Semantic target summary
For each dominant repeated target, record:
- semantic target:
- raw spellings seen:
- request keys seen:
- fan-in count:
- fan-out source boundary (`caller` / `importer` / `dependency` / `redirect`):
- interpretation:

### 3. Coalescing effectiveness summary
- `miss` count:
- `inflight-hit` count:
- `settled-hit` count:
- `alias-hit` count:
- interpretation:

### 4. Divergence point
- first meaningful split observed at:
- first causal owner seam:
- exact raw ids involved:
- whether `https:/...` and `https://...` were semantically equivalent in this path:
- whether the visible split was causal or symptomatic:

### 5. Must-collapse pair
- pair:
- why these must collapse:
- proposed canonical boundary:

### 6. Must-not-collapse nearby pair
- pair:
- why these must remain distinct:
- boundary that preserves the distinction:

### 7. Confirmed primary fault class
Choose one:
- canonical normalization missing or incomplete
- request key formed before canonicalization
- redirect alias timing too late
- importer/dependency hydration reintroduces split ids
- parent/child hydration vocabulary mismatch
- other:

### 8. Proposed narrow fix
- target file(s):
- exact change shape:
- why this is the smallest truthful first identity-boundary fix:

### 9. Rejected alternatives
- broader normalization rejected because:
- persistent resolve cache rejected because:
- resolver-local patch rejected because:
- other alternatives rejected because:

### 10. Risks / watchouts
- authority/cwd correctness risk:
- Vite module-graph identity risk:
- user-visible startup payoff risk:
- other:

## Exit rule
Only after this note is complete should Packet E proceed to deterministic tests and one narrow implementation change.
