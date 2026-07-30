http-compatibility-alias-removal.plan.md
- [x] 8dabb8e2c4fae1c6464a92609acbb77776fc0c08 refactor(http): remove deprecated compatibility type aliases

## Status

Implementation landed and verification passed. Ready for plan retirement.

## Purpose

Remove five deprecated flat aliases from the published `@sys/http` type surface after migrating every in-repo consumer to the canonical namespace paths.

This is a type-only cleanup. Runtime exports and behavior must remain unchanged.

## Current → target

- `HttpServerStarted` → `HttpServer.Started`
- `HonoContext` → `HttpServer.Hono.Context`
- `HonoMiddlewareHandler` → `HttpServer.Hono.MiddlewareHandler`
- `HttpPullToDirResult` → `HttpPull.ToDir.Result`
- `HttpPullEvent` → `HttpPull.Event.Any`

## Scope

### `@sys/http`

- `code/sys/http/src/http.server/m.HttpServer/t.ts`
  - Remove the three deprecated `HttpServer*` / `Hono*` compatibility aliases and their alias-only heading.
- `code/sys/http/src/http.server/m.HttpPull/t.ts`
  - Remove the two deprecated `HttpPull*` compatibility aliases and their alias-only heading.

### `@sys/tools`

- `code/sys.tools/src/common/t.ts`
  - Replace flat HTTP alias re-exports with the root `HttpPull` and `HttpServer` namespaces.
- `code/sys.tools/src/cli.serve/common.t.ts`
  - Export `HttpServer` rather than `HonoMiddlewareHandler`.
- `code/sys.tools/src/cli.serve/m.server/u.serve.route.ts`
  - Use `t.HttpServer.Hono.MiddlewareHandler`.
- `code/sys.tools/src/cli.serve/m.server/-test/-u.serve.route.test.ts`
  - Assert the canonical middleware type.
- `code/sys.tools/src/cli.serve/-test/u.fixture.ts`
  - Derive fixture context and next types from `t.HttpServer.Hono.MiddlewareHandler`.
- `code/sys.tools/src/cli.pull/u.bundle/u.pull/u.pull.http.ts`
  - Use `t.HttpPull.Event.Any` and `t.HttpPull.ToDir.Result`.
- `code/sys.tools/src/cli.pull/t.namespace.ts`
  - Compose bundle results from `t.HttpPull.ToDir.Result`.

### `@sys/driver-deno`

- `code/sys.driver/driver-deno/src/m.cloud/common/t.ts`
  - Export `HttpServer` rather than `HonoContext`.
- `code/sys.driver/driver-deno/src/m.cloud/m.DenoEntry/u.fallback.ts`
  - Use `t.HttpServer.Hono.Context`.

### `@sys/driver-stripe`

- `code/sys.driver/driver-stripe/src/server/t.ts`
  - Use `THttp.HttpServer.Started`.

## Invariants

- Keep `t.ts` and all type barrels type-only.
- Preserve the established semantic namespace paths from `@sys/http`.
- Do not add replacement compatibility aliases.
- Do not change runtime exports, behavior, or implementation logic.
- Do not widen the public API.
- Treat removal as an intentional published type-surface break for unknown external consumers; all known in-repo consumers must migrate atomically.

## Verification

Run from each owning module:

```sh
cd code/sys/http && deno task check && deno task test
cd code/sys.tools && deno task check && deno task test:serve && deno task test:pull
cd code/sys.driver/driver-deno && deno task check
cd code/sys.driver/driver-stripe && deno task test:check
```

Then run a repository residue search for all five removed names. The only allowed occurrence after implementation is historical prose in this temporary plan.

## Acceptance

- All five aliases are absent from `@sys/http`.
- No active source or test references any removed alias.
- Every listed verification command passes.
- Runtime files are unchanged except where a type annotation is migrated.

## Final reality

- Removed all five deprecated aliases from `@sys/http`.
- Migrated every in-repo caller listed in scope to the canonical namespace path.
- Added no compatibility aliases or runtime behavior changes.
- Residue search found removed names only in this temporary plan.
- `@sys/http`: check passed; 39 tests and 308 steps passed.
- `@sys/tools`: check passed; serve 12 tests / 73 steps and pull 29 tests / 92 steps passed.
- `@sys/driver-deno`: check passed.
- `@sys/driver-stripe`: test check passed.
- Final review: SHIP.
- Remaining risk: unknown external consumers may still import the removed published aliases.

## HOLD conditions

- Any additional live in-repo caller is found and cannot be migrated in this change.
- A canonical namespace path is not reachable through the affected package's local `t` pool.
- Verification exposes runtime behavior drift or an unrelated substrate failure.
