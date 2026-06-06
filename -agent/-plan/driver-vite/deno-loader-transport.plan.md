# driver-vite Deno loader transport — completed

- [x] ##### dca2aa9b5 fix(driver-vite): remove esbuild child-runtime scaffolding
- [x] ##### 2fa91a1a9 fix(driver-vite): load remote cache modules by source specifier
- [x] ##### 36ecd5815 chore(workspace): refreshed 10 workspace packages (3 jsr:publish modules)
- [x] ##### 55de5b2ca fix(driver-vite): preserve source specifier in rewritten remote ids
- [x] ##### fc0edaafb chore(workspace): refreshed 10 workspace packages (3 jsr:publish modules)

## Status

DONE.

`@sys/driver-vite@0.0.425` is published and the published external smoke lane is green:

```txt
ok | 9 passed (13 steps) | 0 failed (3m5s)
```

This completes the focused transport stability work. Broader lookup/resolver simplification remains a separate proof-gated plan:

```txt
-agent/-plan/driver-vite/deno-loader-lookup-simplification.plan.md
```

## Completed reality

The focused transport path now uses Deno loader authority for remote/local TS/TSX transforms without root `esbuild` dependency authority.

Completed changes:

- `u.load.ts` uses `jsr:@deno/loader@0.5.0` for TS/TSX transform and source-map output.
- Transform cache keys use `DENO_LOADER_VERSION`, derived from canonical dependency authority.
- Root `/sys` dependency/import/upgrade authority for direct `esbuild` transform use was removed.
- `u.wrangle.ts` no longer resolves or grants child-runtime access to an auxiliary native transform binary.
- Remote JSR extensionless Deno cache files are loaded through their concrete source URL so media type is preserved.
- Concrete remote source specifiers are preserved across:
  - Deno resolution;
  - load-time transform;
  - rewritten child deno IDs.
- Stable Vite/browser wrapper IDs remain separate from loader source/media authority.
- Published fixture pins and generated repo template pins were refreshed to the published fixed driver.

## Relevant commits

```txt
2fa91a1a9 fix(driver-vite): load remote cache modules by source specifier
36ecd5815 chore(workspace): refreshed 10 workspace packages (3 jsr:publish modules)
55de5b2ca fix(driver-vite): preserve source specifier in rewritten remote ids
fc0edaafb chore(workspace): refreshed 10 workspace packages (3 jsr:publish modules)
```

Related earlier cleanup:

```txt
dca2aa9b5 fix(driver-vite): remove esbuild child-runtime scaffolding
```

## Published version

```txt
@sys/driver-vite@0.0.425
```

## Proof

Local proof completed before publish:

```txt
cd code/sys.driver/driver-vite
deno task check
deno task test
deno task dry
```

Published external proof completed after publish:

```txt
cd code/sys.driver/driver-vite
deno task test:external
```

Final result:

```txt
ok | 9 passed (13 steps) | 0 failed (3m5s)
```

External smoke coverage included:

- generated repo external build;
- generated workspace external build;
- published baseline build/dev;
- external pure-JSR authority build/dev;
- std runtime canary;
- published UI baseline static/dynamic TSX builds;
- published UI components build/dev.

## Failure fixed

The failure mode was real published Deno/JSR behavior:

- Deno caches remote JSR modules as extensionless content-addressed files.
- Those extensionless files can contain TSX/TS source.
- Loading them as `file://<extensionless-cache-file>` caused `@deno/loader` to lose media/source context and parse TSX as non-TSX.
- The fix preserves and uses the concrete remote source URL, for example:

```txt
https://jsr.io/@sys/ui-react/<version>/src/...tsx
```

The resulting contract is:

- Vite wrapper/cache IDs stay stable for build/dev graph behavior.
- Loader source specifier carries media/source authority for transform.

## Current transport shape

The current transport is intentionally mixed:

```txt
legacy resolver bridge -> @deno/loader load/transpile -> Vite
```

This is the completed focused scope. The legacy resolver bridge is not deleted here. It remains the subject of the follow-on lookup simplification plan.

## STIER conclusion

The focused transport/esbuild removal scope is DONE DONE.

We can responsibly say:

- direct root `esbuild` transform authority is removed;
- driver-vite no longer depends on root-owned native transform scaffolding;
- the replacement path is published, JSR-backed, and externally proven;
- the green proof is not local-only or workspace-alias-only.

This is a tighter BMIND posture: fewer dependency authorities, less native binary surface, closer to Deno's mainline ESM/runtime semantics, and stronger published-boundary integration proof.
