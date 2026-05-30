# Type alias refactor burn-down

Purpose: track compatibility-style type aliases that should disappear from `t.ts` / type-plane files.

## Remaining

### P0 — HTTP deprecated compatibility aliases

#### `code/sys/http/src/http.server/m.HttpServer/t.ts`

Still present:

- [ ] `HttpServerStarted = HttpServer.Started`
- [ ] `HonoContext = HttpServer.Hono.Context`
- [ ] `HonoMiddlewareHandler = HttpServer.Hono.MiddlewareHandler`

Target replacement:

- `HttpServer.Started`
- `HttpServer.Hono.Context`
- `HttpServer.Hono.MiddlewareHandler`

Notes:

- Already marked `@deprecated` in source.
- Next step: migrate consumers, then remove the alias block.

#### `code/sys/http/src/http.server/m.HttpPull/t.ts`

Still present:

- [ ] `HttpPullToDirResult = HttpPull.ToDir.Result`
- [ ] `HttpPullEvent = HttpPull.Event.Any`

Target replacement:

- `HttpPull.ToDir.Result`
- `HttpPull.Event.Any`

Notes:

- Already marked `@deprecated` in source.
- Next step: migrate consumers, then remove the alias block.

### P1 — ESM flat aliases

#### `code/sys/esm/src/m.core/m.Esm/t.ts`

Still present:

- [ ] `EsmPolicyMode = EsmPolicy.Mode`
- [ ] `EsmPolicyInput = EsmPolicy.Input`
- [ ] `EsmPolicyDecision = EsmPolicy.Decision`
- [ ] `EsmPolicyResult = EsmPolicy.Result`
- [ ] `EsmTopologicalInput = EsmTopological.DecisionInput`
- [ ] `EsmTopologicalResult = EsmTopological.DecisionResult`

Target replacement:

- `EsmPolicy.Mode`
- `EsmPolicy.Input`
- `EsmPolicy.Decision`
- `EsmPolicy.Result`
- `EsmTopological.DecisionInput`
- `EsmTopological.DecisionResult`

Notes:

- Looks like flat public compatibility names over already-clear namespaces.
- Next step: migrate consumers, then remove the flat aliases.

## Done

### Registry flat aliases

Completed in `045386d6d`.

#### `code/sys/registry/src/m.jsr/m.client/m.Fetch/t.ts`

Removed:

- [x] `JsrFetchLib = JsrFetch.Lib`
- [x] `JsrFetchPkgLib = JsrFetch.PkgLib`
- [x] `JsrFetchPkgOptions = JsrFetch.PkgOptions`
- [x] `JsrFetchPkgChecksumOptions = JsrFetch.PkgChecksumOptions`
- [x] `JsrFetchPkgVersionsResponse = JsrFetch.PkgVersionsResponse`
- [x] `JsrFetchPkgInfoResponse = JsrFetch.PkgInfoResponse`
- [x] `JsrFetchPkgFileResponse = JsrFetch.Pkg.FileResponse`
- [x] `JsrPkgMetaVersions = JsrFetch.PkgMetaVersions`
- [x] `JsrPkgMetaVersion = JsrFetch.PkgMetaVersion`
- [x] `JsrPkgVersionInfo = JsrFetch.PkgVersionInfo`
- [x] `JsrPkgGraph = JsrFetch.PkgGraph`
- [x] `JsrPkgGraphModule = JsrFetch.PkgGraphModule`
- [x] `JsrPkgGraphDependency = JsrFetch.PkgGraphDependency`
- [x] `JsrPkgManifest = JsrFetch.PkgManifest`
- [x] `JsrPkgManifestFile = JsrFetch.PkgManifestFile`
- [x] `JsrPkgFileFetcher = JsrFetch.PkgFileFetcher`

Current shape:

- `JsrFetch.Lib`
- `JsrFetch.Pkg.Lib`
- `JsrFetch.Pkg.Options`
- `JsrFetch.Pkg.VersionInfo`
- etc.

#### `code/sys/registry/src/m.npm/m.client/m.Fetch/t.ts`

Removed:

- [x] `NpmFetchLib = NpmFetch.Lib`
- [x] `NpmFetchPkgLib = NpmFetch.PkgLib`
- [x] `NpmFetchPkgOptions = NpmFetch.PkgOptions`
- [x] `NpmFetchPkgVersionsResponse = NpmFetch.PkgVersionsResponse`
- [x] `NpmFetchPkgInfoResponse = NpmFetch.PkgInfoResponse`
- [x] `NpmPkgMetaVersions = NpmFetch.PkgMetaVersions`
- [x] `NpmPkgMetaVersion = NpmFetch.PkgMetaVersion`
- [x] `NpmPkgVersionInfo = NpmFetch.PkgVersionInfo`
- [x] `NpmPkgDistInfo = NpmFetch.PkgDistInfo`

Current shape:

- `NpmFetch.Lib`
- `NpmFetch.Pkg.Lib`
- `NpmFetch.Pkg.Options`
- `NpmFetch.Pkg.VersionInfo`
- `NpmFetch.Url.Lib`
- etc.

#### `code/sys/registry/src/m.npm/m.server/m.Npm/t.ts`

Removed:

- [x] `NpmServerLib = t.NpmClientLib`

Current shape:

- `NpmServer.Lib`

#### `code/sys/registry/src/t.ts`

Updated to use nested namespace surfaces directly.

Examples:

- [x] `Registry.Jsr.Fetch.Lib = J.JsrFetchLib` → `Registry.Jsr.Fetch.Lib = J.JsrFetch.Lib`
- [x] `Registry.Jsr.Fetch.PkgOptions = J.JsrFetchPkgOptions` → `Registry.Jsr.Fetch.Pkg.Options = J.JsrFetch.Pkg.Options`
- [x] `Registry.Npm.Fetch.PkgInfoResponse = N.NpmFetchPkgInfoResponse` → `Registry.Npm.Fetch.Pkg.InfoResponse = N.NpmFetch.Pkg.InfoResponse`

## Hold / not first-pass targets

Do not refactor in this pass without a separate design decision:

- semantic primitive aliases like `StringPath = string`, `TimecodeVTime = t.Msecs`;
- external interop namespaces like `HttpServer.Hono.Context`;
- factor-file namespace projections like `DenoDeploy.Stage.Root = s.Root`, which look like curated public namespace assembly rather than backwards-compatible flat aliases.
