# @sys/http root/client/server namespace refactor

- [x] refactor(http): namespace-factor HTTP type contracts

## Purpose

Convert the active `@sys/http` flat type spines to the canonical namespace-first contract shape used by modern `@sys/*` modules:

```ts
export declare namespace <NS> {
  export type Lib = {
    // primary runtime contract first
  };
}
```

Runtime values stay stable. This is a type-plane refactor, not a behavior change.

Stable runtime surfaces:

```ts
Http.*
HttpClient.*
Fetch.*
Cache.*
HttpServer.*
HttpPull.*
```

## Final status

SHIP.

Landed implementation commits:

- `532999fce refactor(http): namespace-factor HTTP type contracts`
- `9353b0726 fix(http): restore deprecated type aliases`
- `96c11a282 fix(http): preserve media policy ttl signal` — superseded by the next commit after final spec confirmation.
- `9b37bda96 fix(http): restore normalized media policy ttl` — finalizes the intended `HttpCache.Media.Policy.ttl` normalized shape.

Final compatibility aliases retained from downstream proof:

- `HttpServerStarted = HttpServer.Started`
- `HonoContext = HttpServer.Hono.Context`
- `HonoMiddlewareHandler = HttpServer.Hono.MiddlewareHandler`
- `HttpPullToDirResult = HttpPull.ToDir.Result`
- `HttpPullEvent = HttpPull.Event.Any`

These aliases are type-only, marked `@deprecated`, grouped at the bottom of their defining `t.ts` files, and not used internally by `@sys/http`.

TMIND/BMIND final drift audit checked the pre-refactor tree (`917e19202`) against current HEAD. The only semantic-looking cleanup candidate was normalized media policy `ttlMs -> ttl`; final spec confirmation says this was intentional. Final state keeps `PolicyInput.ttlMs?: number` at the user/input boundary and uses normalized internal `HttpCache.Media.Policy.ttl: t.Msecs`.

Final verification:

- `cd code/sys/http && deno task check` — pass after final `ttl` restoration.
- `cd code/sys/http && deno task test --trace-leaks ./src/http ./src/http.client ./src/http.server` — `33 passed (284 steps), 0 failed`.
- `cd code/sys/http && deno task test` — `39 passed (308 steps), 0 failed`.
- `cd /Users/phil/code/org.sys/sys && deno task dry` — workspace dry success, `49` ran, `0` failed.
- `git diff --stat 9353b0726..HEAD -- code/sys/http` — no output; the temporary `ttlMs` correction commit was fully superseded for the final HTTP tree.
- Corrected downstream alias search showed only the deliberate aliases plus known downstream consumers in `code/sys.driver/driver-stripe`, `code/sys.driver/driver-deno`, and `code/sys.tools`; root dry verified those consumers.

Plan retirement: complete; remove this plan in the next commit.

## XHIGH review result

The requested HTTP files are pre-canon flat type spines. They should be refactored to namespace roots with `Lib` first and conceptually earned sub-namespaces.

Modern comparison checked:

- `code/sys/fs/src/m.Dir/t.ts` uses `Dir.Lib`, `Dir.Hash.Lib`, `Dir.Hash.Compute.*`, and `Dir.Hash.Verify.*`.
- `code/sys/fs/src/m.JsonFile/t.ts` uses `JsonFile.Lib`, root contract types, and `JsonFile.Singleton.*`.

The HTTP plan follows that shape: root library first, then root data contracts, then sub-namespaces only when a single concept owns multiple related types.

Rejected during review:

- moving runtime values into `t.ts`;
- exporting types from `mod.ts`;
- widening runtime APIs while renaming type contracts;
- keeping broad flat aliases by default;
- over-factoring single leaf details into speculative namespaces.

## Current legacy flat names

Primary requested legacy names:

```ts
HttpLib
HttpClientLib
HttpWaitOptions
HttpWaitResult
HttpFetchLib
HttpFetchCreateOptions
HttpFetchOptions
HttpFetch
ByteSizeResult
HttpCacheLib
HttpCachePkgArgs
HttpCacheMediaMode
HttpCacheMediaPolicy
HttpCacheMediaPolicyInput
HttpServerLib
HttpServerOptionsOptions
HttpServerKeyboardOptions
HttpServerStartOptions
HttpServerStartKeyboardOptions
HttpServerStarted
HttpServerStatusOptions
HttpServerStatusUrlPath
HttpServerPrintOptions
HttpServerPrintKeyboardOptions
HttpServerCreateOptions
HttpServeStatic
HttpServeStaticOptions
HonoApp
HonoBlankSchema
HonoContext
HonoEnv
HonoMiddlewareHandler
HonoSchema
RouteContext
HttpPullLib
HttpPullToDirResult
HttpPullRecord
HttpPullOptions
HttpPullRetry
HttpPullStream
HttpPullStreamEvents
HttpPullMapOptions
HttpPullEvent
HttpPullMapLib
```

Adjacent flat names visible from these public contracts:

```ts
HttpPreloadLib
HttpCacheCmdLib
```

These adjacent names are not in the six requested target files, but they appear inside the target `Lib` contracts. Treat them as a HOLD boundary if strict no-flat-residue is required in the same commit.

## Target namespace shape

### Root HTTP

```ts
t.Http.Lib
```

`Http.Lib` owns:

```ts
Client: t.HttpClient.Lib
Server: t.HttpServer.Lib
Pull: t.HttpPull.Lib
client: t.HttpFetch.Lib['make']
```

### Fetch client

```ts
t.HttpFetch.Lib
t.HttpFetch.Instance
t.HttpFetch.CreateOptions
t.HttpFetch.Options
t.HttpFetch.ByteSize.Method
t.HttpFetch.ByteSize.Result
```

Notes:

- `HttpFetch.Instance` is the fetch-client lifecycle handle.
- `HttpFetch.ByteSize` is earned because the byte-size probe has overloads and a result payload.
- Default compatibility stance is to remove the root `HttpFetch` flat instance alias. Keep it only if downstream compatibility proof requires it.

### HTTP cache

```ts
t.HttpCache.Lib
t.HttpCache.Pkg.Args
t.HttpCache.Media.Mode
t.HttpCache.Media.Policy
t.HttpCache.Media.PolicyInput
```

Notes:

- `HttpCache.Media` is earned because mode, normalized policy, and user input are one concept.
- `HttpCache.Pkg` is earned because the runtime method is `Cache.pkg(...)` and its args are cache-package specific.
- `HttpCache.Lib.Cmd` should target `t.HttpCache.Cmd.Lib` if `m.HttpCache.Cmd/t.ts` is included in this refactor; otherwise it remains the one explicit HOLD/follow-up item.

### HTTP client

```ts
t.HttpClient.Lib
t.HttpClient.Wait.Options
t.HttpClient.Wait.Result
```

Notes:

- `HttpClient.Wait` is earned because readiness polling owns both options and result contracts.
- `HttpClient.Lib.Preload` should target `t.HttpPreload.Lib` if `m.HttpPreload/t.lib.ts` is included in this refactor; otherwise it remains the one explicit HOLD/follow-up item.

### HTTP server

```ts
t.HttpServer.Lib
t.HttpServer.App
t.HttpServer.Started
t.HttpServer.Create.Options
t.HttpServer.Options.Args
t.HttpServer.Keyboard.Args
t.HttpServer.Start.Options
t.HttpServer.Start.Keyboard.Options
t.HttpServer.Status.Options
t.HttpServer.Status.UrlPath
t.HttpServer.Print.Options
t.HttpServer.Print.Keyboard.Options
t.HttpServer.ServeStatic.Method
t.HttpServer.ServeStatic.Options
t.HttpServer.Hono.App
t.HttpServer.Hono.BlankSchema
t.HttpServer.Hono.Context
t.HttpServer.Hono.Env
t.HttpServer.Hono.MiddlewareHandler
t.HttpServer.Hono.Schema
t.HttpServer.Route.Context
```

Notes:

- `HttpServer.App` and `HttpServer.Started` are root contract nouns because they are primary server concepts used across proxy/static server surfaces.
- `HttpServer.Hono.*` groups external Hono interop aliases instead of leaving them as package-root flat names.
- Alias Hono imports in the type file, e.g. `Hono as HonoBase`, to avoid namespace shadowing.

### HTTP pull

```ts
t.HttpPull.Lib
t.HttpPull.ToDir.Result
t.HttpPull.Record
t.HttpPull.Options
t.HttpPull.Retry.Options
t.HttpPull.Stream.Instance
t.HttpPull.Stream.Events
t.HttpPull.Event.Any
t.HttpPull.Event.Common
t.HttpPull.Map.Lib
t.HttpPull.Map.Options
```

Notes:

- `HttpPull.Map` is earned because the runtime sub-lib already exists and owns map options.
- `HttpPull.Stream` is earned because stream instance and stream events are one concept.
- `HttpPull.Event` is earned because the event union and common event fields are one concept.

## Source files expected to change

### Primary type spines

- `code/sys/http/src/http/t.ts` — replace `HttpLib` with `Http.Lib`.
- `code/sys/http/src/http.client/m.HttpFetch/t.ts` — replace fetch flat contracts with `HttpFetch.*`.
- `code/sys/http/src/http.client/m.HttpCache/t.ts` — replace cache flat contracts with `HttpCache.*`.
- `code/sys/http/src/http.client/m.HttpClient/t.ts` — replace client/wait flat contracts with `HttpClient.*`.
- `code/sys/http/src/http.server/m.HttpServer/t.ts` — replace server/Hono/static flat contracts with `HttpServer.*`.
- `code/sys/http/src/http.server/m.HttpPull/t.ts` — replace pull/map/stream/event flat contracts with `HttpPull.*`.

### Root HTTP references

- `code/sys/http/src/http/m.Http.ts` — type `Http` as `t.Http.Lib` and update `client` factory reference.

### Fetch references

- `code/sys/http/src/http.client/m.HttpFetch/m.Fetch.ts` — type `Fetch` as `t.HttpFetch.Lib`.
- `code/sys/http/src/http.client/m.HttpFetch/m.Fetch.make.ts` — update factory/options/client-handle annotations to `t.HttpFetch.*`.
- `code/sys/http/src/http.client/m.HttpFetch/u.byteSize.ts` — type `byteSize` as `t.HttpFetch.ByteSize.Method` and result as `t.HttpFetch.ByteSize.Result`.
- `code/sys/http/src/http.client/m.HttpFetch/-.test.ts` — update `ByteSizeResult` references.

### Cache references

- `code/sys/http/src/http.client/m.HttpCache/m.Cache.ts` — type `Cache` as `t.HttpCache.Lib`.
- `code/sys/http/src/http.client/m.HttpCache/m.Cache.pkg.ts` — update media policy and `pkg` method annotations to `t.HttpCache.*`.

### Client references

- `code/sys/http/src/http.client/m.HttpClient/m.HttpClient.ts` — type `HttpClient` as `t.HttpClient.Lib`.
- `code/sys/http/src/http.client/m.HttpClient/u.wait.ts` — update `waitFor`, `isAlive`, options, and result annotations to `t.HttpClient.Wait.*`.

### Server references

- `code/sys/http/src/http.server/m.HttpServer/m.Server.ts` — remove direct `HttpServerLib` import and type `HttpServer` as `t.HttpServer.Lib`.
- `code/sys/http/src/http.server/m.HttpServer/m.Server.create.ts` — update create-options alias to `t.HttpServer.Create.Options`; fix the local `Optionsions` typo while touched.
- `code/sys/http/src/http.server/m.HttpServer/u.middleware.ts` — update middleware return type to `t.HttpServer.Hono.MiddlewareHandler`.
- `code/sys/http/src/http.server/m.HttpServer/u.options.ts` — update method alias to `t.HttpServer.Lib['options']`.
- `code/sys/http/src/http.server/m.HttpServer/u.print.ts` — remove direct `HttpServerLib` import and type `print` as `t.HttpServer.Lib['print']`; update keyboard print options.
- `code/sys/http/src/http.server/m.HttpServer/u.print.url.ts` — update status URL-path type to `t.HttpServer.Status.UrlPath`.
- `code/sys/http/src/http.server/m.HttpServer/u.serveStatic.ts` — update serve-static method/options/Hono env types.
- `code/sys/http/src/http.server/m.HttpServer/u.start.ts` — update start method, started handle, start options, and print-keyboard types.
- `code/sys/http/src/http.server/m.HttpServer/u.status.url.ts` — update status URL-path type.
- `code/sys/http/src/http.server/m.HttpServer/-test/u.fixture.usingServer.ts` — update app type to `t.HttpServer.App`.

### Static/proxy downstream references

- `code/sys/http/src/http.server/m.HttpStatic/t.ts` — update started handle and start-keyboard types.
- `code/sys/http/src/http.server/m.HttpStatic/u.start.ts` — update status URL-path type.
- `code/sys/http/src/http.server/m.HttpStatic/-test/-m.cli.test.ts` — update started-handle cast.
- `code/sys/http/src/http.server/m.HttpStatic/-test/-u.start.test.ts` — update close helper handle type.
- `code/sys/http/src/http.server/m.HttpProxy/t.ts` — update started handle, start-keyboard, and Hono app types.
- `code/sys/http/src/http.server/m.HttpProxy/m.HttpProxy.ts` — update status URL-path array types.
- `code/sys/http/src/http.server/m.HttpProxy/-test/-.test.ts` — update server handle type.
- `code/sys/http/src/http.server/m.HttpProxy/-test/u.fixture.usingServer.ts` — update app type.

### Pull references

- `code/sys/http/src/http.server/m.HttpPull/m.HttpPull.ts` — type `HttpPull` as `t.HttpPull.Lib`.
- `code/sys/http/src/http.server/m.HttpPull/u.dir.ts` — update `toDir` method type.
- `code/sys/http/src/http.server/m.HttpPull/u.map.ts` — type `PullMap` as `t.HttpPull.Map.Lib`.
- `code/sys/http/src/http.server/m.HttpPull/u.pullOne.ts` — update options, retry, record, and map annotations to `t.HttpPull.*`.
- `code/sys/http/src/http.server/m.HttpPull/u.ts` — update map options in `resolveTarget`.
- `code/sys/http/src/http.server/m.HttpPull/u.stream.ts` — update options, stream, record, event, result, and stream-event annotations.
- `code/sys/http/src/http.server/m.HttpPull/-test/-u.stream.test.ts` — update event-array annotations.

### Exports/type pool

- `code/sys/http/src/types.ts` — expected unchanged unless ordering comments need cleanup; it already exports the target type files.
- `code/sys/http/src/common/t.ts` — expected unchanged unless type-check reveals a shadow or missing aggregation issue.

## Compatibility alias policy

Final stance:

- the implementation kept the clean namespace cut for `@sys/http` internals;
- no `*Lib`, `*Options`, or broad fetch-instance aliases were restored;
- downstream proof from root dry and targeted search justified a narrow compatibility set for existing public callers;
- those aliases are type-only, `@deprecated`, and grouped at the bottom of the defining type spine.

Retained aliases:

```ts
/** @deprecated Use `HttpServer.Started`. */
export type HttpServerStarted = HttpServer.Started;
/** @deprecated Use `HttpServer.Hono.Context`. */
export type HonoContext = HttpServer.Hono.Context;
/** @deprecated Use `HttpServer.Hono.MiddlewareHandler`. */
export type HonoMiddlewareHandler = HttpServer.Hono.MiddlewareHandler;
/** @deprecated Use `HttpPull.ToDir.Result`. */
export type HttpPullToDirResult = HttpPull.ToDir.Result;
/** @deprecated Use `HttpPull.Event.Any`. */
export type HttpPullEvent = HttpPull.Event.Any;
```

Internal implementation references remain on canonical `t.<NS>.*` names.

## Import/reference updates outside target `t.ts`

Required patterns:

```ts
// Before
export const HttpServer: HttpServerLib = { ... };
import type { HttpServerLib } from './t.ts';

// After
import { type t } from './common.ts';
export const HttpServer: t.HttpServer.Lib = { ... };
```

```ts
// Before
type F = t.HttpServerLib['start'];

// After
type F = t.HttpServer.Lib['start'];
```

```ts
// Before
const events: t.HttpPullEvent[] = [];

// After
const events: t.HttpPull.Event.Any[] = [];
```

Runtime files should use the canonical local type pool:

```ts
import { type t } from './common.ts';
```

Direct imports of public type names from local `./t.ts` should be removed from touched runtime files unless a cycle/performance exception is explicitly documented.

## Implementation sequence

1. Refactor the six primary `t.ts` files to namespace-first shape with `Lib` first.
2. Run a narrow stale-name search to identify mechanical reference updates.
3. Update runtime object annotations and local method aliases through the canonical `t` lane.
4. Update downstream `HttpStatic` and `HttpProxy` type references that consume `HttpServer.*` contracts.
5. Update pull, fetch, cache, client tests and fixtures that reference old names.
6. Decide the explicit HOLD boundary for `HttpPreloadLib` and `HttpCacheCmdLib` before claiming no-flat-residue completion.
7. Run verification through the `@sys/http` task surface.
8. Perform a final residue search for old flat names and direct `./t.ts` type imports.

## Verification commands

Run from the nearest module directory:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/http
deno task check
```

Targeted tests:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/http
deno task test --trace-leaks ./src/http ./src/http.client ./src/http.server
```

Final package test if targeted proof passes:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/http
deno task test
```

Residue search before final review:

```sh
rg -n --glob '!**/-agent/**' "\b(HttpLib|HttpClientLib|HttpFetchLib|HttpCacheLib|HttpServerLib|HttpPullLib|HttpWaitOptions|HttpWaitResult|HttpFetchCreateOptions|HttpFetchOptions|ByteSizeResult|HttpCachePkgArgs|HttpCacheMediaMode|HttpCacheMediaPolicy|HttpCacheMediaPolicyInput|HttpServerOptionsOptions|HttpServerKeyboardOptions|HttpServerStartOptions|HttpServerStartKeyboardOptions|HttpServerStarted|HttpServerStatusOptions|HttpServerStatusUrlPath|HttpServerPrintOptions|HttpServerPrintKeyboardOptions|HttpServerCreateOptions|HttpServeStatic|HttpServeStaticOptions|HonoApp|HonoBlankSchema|HonoContext|HonoEnv|HonoMiddlewareHandler|HonoSchema|RouteContext|HttpPullToDirResult|HttpPullRecord|HttpPullOptions|HttpPullRetry|HttpPullStream|HttpPullStreamEvents|HttpPullMapOptions|HttpPullEvent|HttpPullMapLib)\b" /Users/phil/code/org.sys/sys/code/sys/http/src
```

Expected clean-cut result: no hits outside deliberate deprecated alias blocks.

Direct local type-import residue:

```sh
rg -n --glob '!**/-agent/**' "from './t\.ts'|from \"./t\.ts\"" /Users/phil/code/org.sys/sys/code/sys/http/src/http /Users/phil/code/org.sys/sys/code/sys/http/src/http.client /Users/phil/code/org.sys/sys/code/sys/http/src/http.server
```

Expected clean-cut result: no direct public type imports from local `./t.ts` in touched runtime files.

## HOLD conditions

HOLD before implementation if any of these are true:

- the intended compatibility stance changes from clean cut to staged deprecated aliases;
- implementation proof shows external/public callers inside the workspace still require legacy flat aliases;
- strict S-tier acceptance requires converting adjacent `HttpPreloadLib` and `HttpCacheCmdLib` in the same commit, because that widens the scope beyond the six requested target files;
- a required type would force runtime values, side effects, or runtime-module re-exports into `t.ts`;
- a namespace name cannot be derived from the stable runtime public surface and current usage.

## S-tier residue pass

Before final review:

- each primary target has `export declare namespace <NS>` or equivalent namespace-first type-plane shape;
- each root namespace puts `Lib` first;
- sub-namespaces are earned concepts, not aesthetic grouping;
- no runtime value moved into `t.ts`;
- runtime value exports remain unchanged;
- all touched runtime files use the canonical local `type t` lane;
- direct `./t.ts` public type imports are removed from touched runtime files;
- old flat names are gone unless a deliberate deprecated alias block was chosen;
- `HttpServer.Hono.*` aliases are grouped and imported without namespace shadowing;
- `HttpPull.Map`, `HttpPull.Stream`, and `HttpPull.Event` references are consistent;
- verification commands were run from `code/sys/http` through declared `deno.json` tasks.
