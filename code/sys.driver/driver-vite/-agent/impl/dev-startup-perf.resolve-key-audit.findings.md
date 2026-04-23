# Packet E findings checkpoint: resolve-key audit

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

### 2. Per-specifier frequency summary
- top repeated specifiers:
- counts:
- whether repeated equivalent ids dominate or not:

### 3. Coalescing effectiveness summary
- `miss` count:
- `inflight-hit` count:
- `settled-hit` count:
- `alias-hit` count:
- interpretation:

### 4. Divergence point
- first meaningful split observed at:
- exact raw ids involved:
- whether `https:/...` and `https://...` were semantically equivalent in this path:

### 5. Confirmed primary fault class
Choose one:
- canonical normalization missing or incomplete
- request key formed before canonicalization
- redirect alias timing too late
- importer/dependency hydration reintroduces split ids
- parent/child hydration vocabulary mismatch
- other:

### 6. Proposed narrow fix
- target file(s):
- exact change shape:
- why this is the smallest truthful fix:

### 7. Rejected alternatives
- broader normalization rejected because:
- persistent resolve cache rejected because:
- other alternatives rejected because:

### 8. Risks / watchouts
- authority/cwd correctness risk:
- Vite module-graph identity risk:
- other:

## Exit rule
Only after this note is complete should Packet E proceed to a deterministic failing test and one narrow implementation change.
