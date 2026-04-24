# Packet C — canonical optimizeDeps surface in `Vite.Config.app(...)`

## Status
Active narrow implementation packet.

## Why this packet is open now
Outside-in `slc-data` startup evidence now shows a real Vite dep-optimizer churn seam after Packet D and Packet E:

- Vite cache files are being written under `node_modules/.vite/deps/`
- repeated startup logs still show incremental `new dependencies optimized` batches
- repeated `optimized dependencies changed. reloading` indicates late-discovered dependency breadth and/or cache-authority churn
- the current driver config did not expose a canonical `optimizeDeps` surface from `Vite.Config.app(...)`

This is a driver-owned gap even though each call-site’s final hot dep list remains app-specific.

## Current sequencing decision
This packet remains a valid narrow keeper, but it is not the current root-causal lead.

The current startup evidence should be read as two fault classes:
- Class 1: cross-start optimizer invalidation (for example `Re-optimizing dependencies because vite config has changed`)
- Class 2: same-session late dependency discovery (for example `optimized dependencies changed. reloading`)

Before any app-local `optimizeDeps.include` tuning is treated as the next fix, a separate driver lane should first test Class 1 directly:
- explicitly consumer-local Vite optimizer cache authority
- driver-owned subcaches remaining subordinate to that resolved Vite authority
- first implementation suspicion: project-root vs workspace-root resolution of `paths.cwd`
- before/after restart proof showing whether repeated optimizer invalidation materially drops

If the cache-authority lane removes most repeated Class 1 churn:
- keep this packet as the canonical config surface
- do not widen into driver default include lists
- do not add `dev.warmup`

If material Class 2 churn remains after that proof:
- use this packet’s surface for truthful call-site tuning
- then decide whether any later driver-level derivation/default lane is justified

## Packet thesis
Add a narrow, typed `optimizeDeps` pass-through to `Vite.Config.app(...)` so consumers can configure Vite dep-optimizer breadth canonically without dropping out of the driver abstraction.

## Scope
### In
- add typed `optimizeDeps` option to `ViteConfigAppOptions`
- thread that option into the returned Vite config from `src/m.vite.config/u.app.ts`
- preserve current behavior when unset
- add focused tests proving default non-widening behavior and pass-through

### Out
- no app-specific default include list
- no auto-derived optimize deps
- no `dev.warmup` / server warmup in this packet
- no `sys:npm-prewarm` narrowing
- no transport changes
- no call-site `slc-data` tuning in this packet

## Owner seam
`@sys/driver-vite` currently owns the canonical app-config surface but does not expose Vite’s dep-optimizer controls there.

## Must prove
1. `Vite.Config.app(...)` accepts a typed `optimizeDeps` option.
2. When omitted, returned config keeps `optimizeDeps` unset.
3. When provided, returned config preserves caller intent without adding driver-owned defaults.
4. Existing plugin/config behavior remains unchanged.

## Stop conditions
Stop after:
- type surface exists
- config wiring exists
- tests pin non-widening default and pass-through behavior

Do not widen into heuristic defaults in the same packet.
Do not treat this packet as proof that app-local tuning is already the root-causal answer.

## Likely commit
`feat(driver-vite): expose optimizeDeps in app config`
