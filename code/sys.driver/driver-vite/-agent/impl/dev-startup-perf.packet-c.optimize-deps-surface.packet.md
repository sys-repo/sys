# Packet C — canonical optimizeDeps surface in `Vite.Config.app(...)`

## Status
Active narrow implementation packet.

## Why this packet is open now
Outside-in `slc-data` startup evidence now shows a real Vite dep-optimizer churn seam after Packet D and Packet E:

- Vite cache files are being written under `node_modules/.vite/deps/`
- repeated startup logs still show incremental `new dependencies optimized` batches
- repeated `optimized dependencies changed. reloading` indicates late-discovered dependency breadth
- the current driver config does not expose a canonical `optimizeDeps` surface from `Vite.Config.app(...)`

This is a driver-owned gap even though each call-site’s final hot dep list remains app-specific.

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

## Likely commit
`feat(driver-vite): expose optimizeDeps in app config`
