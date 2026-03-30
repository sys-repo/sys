# tmp.proxy Implementation Plan

## Goal
Implement a minimal reverse proxy that:
- proxies unmatched requests to a root upstream
- proxies mounted bundle paths to configured bundle upstream roots
- works for shallow or deep local mount paths
- works for shallow or deep upstream bundle roots
- stays lean by avoiding content rewriting in v1

## Current Contract
Source of truth:
- `/Users/phil/code/org.sys/sys/deploy/tmp.proxy/src/m.server/t.ts`

Current design primitives:
- `root.upstream`
- `mounts[].mountPath`
- `mounts[].bundleRootUpstream`
- `port`
- `Resolver`
- `ResolverFactory`
- `ResolveResult`

Normalization invariants:
- `mountPath` must start and end with `/`
- `mountPath: '/'` is invalid
- `bundleRootUpstream` must end with `/`

Routing invariants:
- longest-prefix wins
- duplicate `mountPath` is a startup/config error
- a mount claims its path-space over the root fallback
- exact no-slash mount requests redirect with `308` to trailing-slash form
- query strings must be preserved during redirects and forwarding
- if `root` is configured, unmatched requests forward there
- a true no-match only exists when `root` is not configured

## V1 Boundaries
Included in v1:
- config normalization
- pure request-path resolver
- mount matching
- path suffix forwarding
- query-string passthrough in the runtime layer
- real upstream fetch passthrough
- real HTTP tests using `Deno.serve({ port: 0 }, app.fetch)`

Explicitly out of scope in v1:
- HTML response rewriting
- `<base href>` rewriting
- `Location` header rewriting
- content-aware proxy transforms

Upstream constraints in v1:
- bundles should use relative asset URLs
- bundles should not rely on absolute `<base href>`
- upstream redirects should ideally be relative
- absolute upstream `Location` redirects are not rewritten in v1

## Implementation Order
1. Add a pure mapping module.
   - normalize config
   - reject `mountPath: '/'`
   - reject duplicate mounts
   - validate upstream URLs are parseable
   - sort mounts by descending `mountPath.length`
   - use one shared path-algebra for both root and mount forwarding
   - accept pathname only
   - resolve pathname to one of:
     - root upstream forward
     - mount upstream forward
     - `308` slash redirect
     - no-match (only when no `root` fallback exists)
   - return the typed `ResolveResult` union from `t.ts`

2. Add pure unit tests for mapping.
   - root fallback
   - invalid `/` mount rejection
   - single-segment mount
   - multi-segment mount
   - longest-prefix wins
   - duplicate mount rejection
   - `308` preserves query strings
   - `/slc?x=1` -> `308` -> `/slc/?x=1`
   - `308` behavior is intentional for non-GET methods
   - encoded-slash behavior against actual Deno URL parsing assumptions

3. Add real HTTP fixture tests.
   - reuse the house pattern from:
     - `/Users/phil/code/org.sys/sys/code/sys/http/src/http.server/m.HttpServer/-test/fixture.usingServer.ts`
   - use `port: 0`
   - use real upstream mini-servers
   - assert redirect and upstream path behavior over real HTTP
   - verify protocol/header behavior that Deno `fetch()` gives us by default
   - assert mounted query-string preservation end-to-end
   - assert encoded-slash behavior against real runtime routing
   - assert `502 Bad Gateway` behavior when upstream fetch fails

4. Wire the runtime server.
   - `ReverseProxy.create()` delegates to the pure mapper
   - use one catch-all handler for runtime dispatch
   - proxy root fallback requests through the same path-algebra as mounts
   - proxy mounted bundle requests
   - append `url.search` in the runtime layer, not in the pure resolver
   - preserve method, headers, status, and body
   - forward upstream `Location` headers unchanged in v1
   - wrap upstream fetch failures and return `502 Bad Gateway`

5. Manual verification via `deno task start`.
   - `/`
   - mounted root without slash
   - mounted root with slash
   - mounted `pkg/...`
   - mounted `images/...`

## Concrete URL Targets
Reference scenarios are documented in:
- `/Users/phil/code/org.sys/sys/deploy/tmp.proxy/src/main.ts`

Key redirect scenario to preserve explicitly:
- `/slc?x=1` -> `308` -> `/slc/?x=1`

## Notes
Keep the proxy transport-only in v1.
If upstream `Location` rewriting or HTML `<base>` rewriting becomes necessary, add that as a separate phase after the lean path is proven.
