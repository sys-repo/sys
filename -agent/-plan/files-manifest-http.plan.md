- [x] `feat(server): add files manifest HTTP projection` — `6f610e142`
- [x] `feat(cli): preserve owner service URL order` — `4142cf08c`
- [x] `fix(files): tighten manifest JSON projection` — `dc2d32795`
- [x] `fix(files): move manifest metadata under .meta` — `652ecb220`

# Files manifest HTTP projection plan

## Status

All planned transport, formatter, sample, and manifest JSON refinement work has landed. This plan is
complete and retained as an implementation record.

Originally revised after comparing the WebSocket service path with the pure HTTP Cmd sample at
`code/sys/server/-sample/files.http.cmd`.

The corrected noun is not "WebSocket manifest route". The corrected noun is:

> a bounded Files backing can expose a small HTTP GET projection of its existing manifest command.

The WebSocket service needs a sidecar hook only because it owns a `Deno.serve(...)` instance without
a router. The manifest projection itself belongs to `@sys/server/files`, not inside the WebSocket
transport.

## What changed from the first plan

The first plan was too WebSocket-centered because the need emerged while looking at a Cell-started
WS service.

The pure HTTP sample shows the broader shape:

- `GET /files` currently serves human help text.
- `POST /files` goes through `HttpCmd.handle(...)`.
- `files:manifest` already works over HTTP Cmd as a POST command.
- The missing DX affordance is a direct `GET /files/manifest` JSON projection.

So the correct implementation should be shared by:

- `FilesServer.WebSocket` via same-port HTTP sidecar;
- the HTTP Cmd sample via its Hono app;
- any future Files HTTP Cmd service if that surface earns promotion later.

## Scope

Primary scope:

- `@sys/server/files` owns the Files manifest HTTP projection helper.
- `@sys/server/websocket` gets only the minimal owner HTTP sidecar needed by WS services.
- `code/sys/server/-sample/files.http.cmd` uses the same projection as proof that this is not a
  WS-only feature.
- `@sys/cell` startup formatting changes only if needed to render multiple owner-reported URLs in
  order.

Non-goals:

- No Files-specific logic in Cell.
- No formal Files HTTP Cmd service endpoint in this pass.
- No static-file server behavior.
- No new Files manifest model; reuse the existing `files:manifest` command result.
- No hard-coded `/files` route beyond the existing default.
- No route table or framework abstraction inside the WebSocket primitive.

## Confirmed route fact

`/files` is a default, not a hard-coded route.

Current flow:

- `code/sys/server/src/m.server.files/common.ts` defines `D.path = '/files'`.
- `code/sys/server/src/m.server.files/m.Service/u/u.config.schema.ts` uses
  `doc.path?.trim() ?? D.path`.
- `FilesWebSocketService.start(...)` passes the normalized config path into `WebSocket.create(...)`.
- Direct `FilesServer.WebSocket.create/start(...)` accepts `path` and only defaults when omitted.

The HTTP manifest path must derive from the effective Files service/Cmd path:

```txt
/files        → /files/manifest
/draft/files  → /draft/files/manifest
/             → /manifest
```

## Ownership decision

### Not `@sys/model/files`

The model owns Files grammar, backings, policy, and the `files:manifest` result shape. HTTP response
construction is server transport projection, not model behavior.

### Not `@sys/http/cmd`

`HttpCmd` owns unary Cmd-over-HTTP POST semantics. A direct GET manifest endpoint is a
Files-specific projection, not a generic Cmd transport concern.

### Not `m.server.files/m.WebSocket`

WebSocket is one consumer. Burying the projection there would cause duplication when HTTP Cmd wants
the same GET affordance.

### Yes: `@sys/server/files`

`@sys/server/files` already owns transport facades over bounded Files backings. The projection is a
Files server concern: same backing, same policy, HTTP-shaped response.

## Target Files projection helper

Add one small helper under `code/sys/server/src/m.server.files/`, surfaced through `FilesServer`.
The exact file/module names can follow local fit during implementation, but the public concept
should read like:

```ts
const manifest = FilesServer.Http.manifest({ files, path });
```

Expected projection shape:

```ts
type ManifestProjection = {
  /** Derived manifest route, e.g. `/files/manifest`. */
  readonly path: t.StringUrlRoute;

  /** Status URL label for owner service reporting. */
  readonly label: 'files:manifest';

  /** Return true when the request targets this projection path. */
  readonly matches: (request: Request) => boolean;

  /** Build the HTTP response for a matching request. */
  readonly response: (request: Request) => Promise<Response>;
};
```

Implementation requirements:

- Derive `path` from the effective base path, defaulting through existing Files server defaults.
- Call `files.handlers[Files.Cmd.Name.manifest]({})` for response data.
- Serialize through the canonical `Json` surface from the local `common.ts` lane.
- Return `content-type: application/json; charset=utf-8`.
- Return `405` with `allow: GET` when the projection path matches but method is not `GET`.
- Return structured JSON failure using `Err.std(...)` if the manifest handler fails.
- Do not create a projection when `files.capabilities.manifest !== true`.

The helper should not know about Hono, Cell, WebSocket startup formatting, or sample-local config.

## Commit 1: server feature

Commit message:

```txt
feat(server): add files manifest HTTP projection
```

### Server/files changes

Add the shared projection helper and surface it through `FilesServer`.

Preferred public shape:

```ts
FilesServer.Http.manifest({ files, path });
```

This commit should update `FilesServer.Lib` to include an HTTP projection namespace only for the
earned manifest helper. Do not add speculative HTTP server/client APIs.

### WebSocket primitive changes

Add a narrow owner HTTP sidecar to `WebSocketServer.create/start`.

Preferred shape:

```ts
export namespace WebSocketServer {
  export type HttpOptions = {
    readonly handle: HttpHandler;
    readonly urls?: readonly HttpStatusUrl[];
  };

  export type HttpHandler = (request: Request) =>
    | Response
    | undefined
    | Promise<Response | undefined>;

  export type HttpStatusUrl =
    | t.StringUrlRoute
    | { readonly path: t.StringUrlRoute; readonly label?: string };
}
```

Then add to `CreateOptions`:

```ts
readonly http?: HttpOptions;
```

Behavior in `m.server.websocket/u/u.create.ts`:

1. Let `input.http?.handle(request)` run before WebSocket admission.
2. If it returns a `Response`, return it.
3. Otherwise continue the current `acceptRequest(...)` upgrade path.

Preserve current behavior:

- wrong WS path still returns `404`;
- non-upgrade request to the WS path still returns `426` unless owner HTTP handles it;
- custom `accept` still governs WebSocket upgrades, not owner HTTP diagnostics.

Extend WebSocket service status so `status().urls` includes:

1. primary WebSocket URL first;
2. owner HTTP status URLs resolved against the same HTTP origin.

### Files WebSocket facade changes

`FilesServer.WebSocket.create/start(...)` should consume the shared projection:

- create a manifest projection only when `files.capabilities.manifest === true`;
- mount it through `WebSocketServer.http.handle`;
- report its status URL after the primary WS URL;
- keep the primary `server.url` as the WebSocket URL.

For default path:

```ts
status.urls === [
  { href: server.url, label: 'files:websocket' },
  { href: `${server.origin}/files/manifest`, label: 'files:manifest' },
];
```

For custom path `/draft/files`:

```txt
ws://localhost:<port>/draft/files
http://localhost:<port>/draft/files/manifest
```

### HTTP Cmd sample changes

Update `code/sys/server/-sample/files.http.cmd/-start.ts` to use the same projection:

- keep `GET /files` as human help text;
- keep `POST /files` as `HttpCmd.handle(...)`;
- add `GET /files/manifest` using `FilesServer.Http.manifest({ files, path: SampleFiles.path })`;
- report both HTTP URLs in `HttpServer.start(... status.urlPaths ...)`.

This sample is the proof that the projection is transport-shared and not WS-only.

### Direct startup formatting

Update direct WebSocket startup formatting if needed so owner-reported URL order is preserved. The
first URL is the primary service URL; do not reorder it behind derived HTTP routes.

### Server tests

Add or update narrow server tests:

- `WebSocketServer/request admission` proves owner HTTP responses work without breaking upgrade
  rules.
- `FilesServer.Http.manifest` proves:
  - default base path derives `/files/manifest`;
  - custom base path derives `<custom>/manifest`;
  - HTTP JSON equals the direct `files:manifest` command result;
  - non-GET on the manifest path returns `405`.
- `FilesServer.WebSocket.create` proves:
  - default path reports `/files/manifest` when `path` is omitted;
  - custom path reports `<custom>/manifest`;
  - `GET <path>/manifest` equals direct `files:manifest`;
  - backing without manifest capability reports no HTTP manifest URL and GET returns `404`.
- `FilesWebSocketService.start` proves service YAML custom `path` is reflected in both URLs.
- `sample:files:http:cmd` proves `GET /files/manifest` works beside `GET /files` help and
  `POST /files` Cmd transport.
- Direct WebSocket formatter test proves multiple URLs preserve owner order.

Include docs/help updates in this same server commit if the DSL/help bundle mentions startup output,
Files WebSocket behavior, or the HTTP Cmd sample. Do not split a docs-only commit unless the server
change becomes too large.

## Commit 2: Cell print layout

Commit message:

```txt
feat(cell): preserve owner service URL order
```

### Cell behavior

Cell should continue to treat `handle.status().urls` as renderer-neutral owner data.

In `code/sys/cell/src/m.cli/u.fmt/u.services.ts`:

- render all owner URLs;
- preserve owner-reported order;
- keep the first URL as the primary URL row;
- avoid Files-specific labels, route names, or assumptions.

Preferred first pass output remains low-noise:

```txt
url            ws://localhost:5050/files
               http://localhost:5050/files/manifest
```

Do not promote `t.Service.Url.label` into visible row labels in this pass unless tests show the
output is ambiguous. URL shape is already sufficient for the Files manifest case.

### Cell tests

Update `code/sys/cell/src/m.cli/-test/-fmt.services.test.ts` to prove:

- multiple URLs are printed;
- owner order is preserved (`ws://.../files` before `http://.../files/manifest`);
- URL-redundant details remain hidden;
- Cell does not need to know the service is Files.

## Follow-up: manifest JSON projection refinement

This is now the active refinement lane. Keep it small and tight; do not reopen the transport/fmt
work unless an invariant below forces it.

### Projection contract decisions

- Change manifest `version` from `sys.files.manifest.v1` to `sys.files.manifest:v1`.
- Apply the version change at the Files model contract/backing layer, not as an HTTP-only rewrite.
- Keep manifest entries aligned with the existing `t.Files.Entry` contract:
  - use `size?: t.NumberBytes`, not `bytes`;
  - expose `hash?: t.StringHash` only when the backing already knows it;
  - do not compute live hashes while serving a manifest.
- `DistPkg` already uses `size` terminology:
  - package totals are `dist.build.size.{total,pkg}`;
  - part metadata parses as `{ hash, size }` from `sha256-...:size=<bytes>`.

### Capability and error semantics

- If `files.capabilities.manifest !== true`, do not install/report the manifest projection.
- A request to the uninstalled projection path should fall through to the hosting transport and
  return the appropriate miss response, currently `404` for the WebSocket sidecar path.
- If the projection is installed but the backing command denies or fails, the server must not crash.
- Tighten HTTP error mapping instead of returning every command failure as `500`:
  - policy denied → `403`;
  - invalid path/payload → `400`;
  - not found/not directory → `404`;
  - unsupported → `501` or `400` after reviewing existing error naming;
  - unknown failure → `500`.
- Keep failure bodies JSON and structured through `Err.std(...)`.

### Sample split: static dist manifest vs live WS manifest

Use the two samples to demonstrate both metadata modes:

- `code/sys/server/-sample/files.http.cmd` should generate a `dist.json` before startup using
  `Pkg.Dist.compute(...)` from `@sys/fs`, then serve from a static/dist-backed Files surface so its
  manifest entries expose known `hash` values and available `size` values.
  - Do not write generated `dist.json` into the tracked sample `docs/` directory; `build.time` would
    churn and dirty the worktree.
  - To satisfy the literal `dist.json` sample requirement without dirtying the repo, copy the docs
    fixture to a runtime temp directory, run `Pkg.Dist.compute({ save: true })` there, serve that
    temp root, and clean it up after `server.finished`.
- `code/sys/server/-sample/files.ws` should remain the live filesystem sample with no generated
  `dist.json`; its manifest should expose live stat metadata such as `size` when available through
  filesystem stat, but no `hash` unless the live backing capability already supplies one.

The split is intentional:

- HTTP Cmd sample: deterministic dist metadata, visible `hash` on file entries.
- WebSocket sample: live filesystem metadata, no synthetic hash computation.

### Candidate implementation notes

- Add `Pkg` to `files.http.cmd/common.ts` from `@sys/fs` if not already surfaced by the local lane.
- Add `FilesStatic` to `files.http.cmd/common.ts` from `@sys/model/files/static`; the export already
  exists at the model package boundary.
- In `files.http.cmd/-start.ts`, copy `docs/` into a temp runtime root, compute/save `dist.json` in
  that temp root, create the static Files backing from the returned `dist`, start the server from
  that temp root, and remove the temp root after `server.finished`.
- Update `sample-files-http-cmd` permissions to include write for the temp root/dist generation and
  cleanup.
- Prefer using the existing static/dist Files backing. Do not invent a second dist parser in
  `@sys/server`.
- For the filesystem backing, enrich list/manifest entries with `stat` metadata (`size`,
  `modifiedAt`, etc.) after path/policy filtering when the walk entry did not already carry stat
  metadata. This is metadata I/O only; do not read file contents and do not compute hashes.
- Static/dist `files:read` returns content refs, not inline text. Update HTTP Cmd sample tests/help
  accordingly; do not accidentally assert old inline-read semantics on a static backing.
- Update sample tests to assert at least one manifest file entry has `size` and `hash` in the HTTP
  Cmd sample, while the WS/live sample remains hash-free unless fixture data explicitly provides
  hashes.

## TMIND review

### Hostile view: accidental authority widening

Risk: a convenient HTTP debug route bypasses Files policy.

Resolution: route calls the existing `files:manifest` handler on the same bounded backing. If
manifest capability is false, the WebSocket facade does not install or report the projection.

### Hostile view: wrong abstraction from origin story

Risk: because the need emerged from WebSocket service output, implementation lands in WebSocket and
gets duplicated for HTTP Cmd.

Resolution: the projection belongs to `@sys/server/files`; WebSocket and HTTP Cmd sample consume it.

### Hostile view: WebSocket primitive becomes a router

Risk: adding HTTP behavior to `WebSocketServer` turns a command socket primitive into a web
framework.

Resolution: expose only one owner hook returning `Response | undefined`, with optional status URL
metadata. No route tables, middleware, params, or static serving.

### Hostile view: Cell learns Files semantics

Risk: Cell sees `files:manifest` and starts special-casing service kinds.

Resolution: Cell only renders `t.Service.Status.urls` in order. Files owns the second URL.

### Hostile view: `/files` leaks into implementation

Risk: tests pass because the implementation assumes `/files`.

Resolution: tests must cover omitted path default and custom path. Manifest route derivation must
use the effective base path.

### Hostile view: output reordering hides the primary URL

Risk: current `orderBaseLast(...)` behavior moves `/files` after `/files/manifest`, making the debug
URL appear primary.

Resolution: service renderers preserve owner URL order. Owner status reports the primary transport
URL first.

## BMIND simplification

The simplest correct statement is:

> Files already has a manifest command. Server/files may project that command as GET JSON.
> Transports may mount that projection. Renderers only print reported URLs.

This keeps the nouns clean:

- Files model: manifest data contract.
- Server/files: HTTP projection of a bounded Files backing.
- WebSocket server: same-port owner HTTP escape hatch.
- HTTP Cmd sample: direct use of the projection beside Cmd POST.
- Cell: generic service status rendering.

## Next follow-up: manifest `.meta` envelope

### Desired contract shape

Move manifest control/provenance facts under the reserved top-level `.meta` field, leaving root
`entries` as the primary data payload.

```json
{
  ".meta": {
    "version": "sys.files.manifest:v1",
    "capabilities": {
      "list": true,
      "stat": true,
      "read": true,
      "write": false,
      "remove": false,
      "watch": false,
      "manifest": true,
      "fidelity": "snapshot"
    },
    "dist": {
      "build": {
        "time": 1778032246833
      }
    },
    "page": {
      "cursor": "files:cursor:manifest:v1:...",
      "truncated": true
    }
  },
  "entries": []
}
```

Rules:

- Use top-level `.meta`, matching JsonFile and WorkspaceGraph snapshot convention.
- Keep the manifest identifier as `.meta.version`, not `.meta.schemaVersion`; the value already
  names the Files manifest wire contract (`sys.files.manifest:v1`) rather than a deeper migration
  schema.
- Move root `capabilities` to `.meta.capabilities`.
- Move static/dist provenance from root `generated` to `.meta.dist.build.time` as a
  `t.UnixTimestamp`, mirroring `DistPkg.build.time` exactly.
- Move page facts to `.meta.page.{cursor,truncated}`; do not use colon-qualified fields like
  `cursor:truncated` because this is an object concept, not qualifier metadata.
- Omit `.meta.dist` when the backing is not dist-backed.
- Omit `.meta.page` when neither `cursor` nor `truncated` is present.
- Keep root `entries` clean.
- Keep root `content` for now if `payload.content === true`; it is data, not control/provenance.

### Implementation plan

Model first, projection second:

1. Update `t.Files.Manifest` in `code/sys.model/model/src/m.files/t.ts`:
   - add `Manifest.Meta` types if it improves readability;
   - remove root `version`, `capabilities`, `generated`, `cursor`, `truncated`;
   - add readonly `'.meta': Manifest.Meta`;
   - keep `entries` and optional `content` at root.
2. Update backings:
   - `m.files.fs/u.cmd/u.cmd.manifest.ts` emits `.meta.version`, `.meta.capabilities`, optional
     `.meta.page`.
   - `m.files.memory/u.cmd/u.cmd.manifest.ts` same.
   - `m.files.static/u.cmd/u.cmd.manifest.ts` same plus optional `.meta.dist.build.time`.
3. Update static index dist provenance:
   - keep reading from `DistPkg.build.time`;
   - preserve it as `t.UnixTimestamp`, not ISO string;
   - rename internal `generated` concepts to `buildTime`/`distBuildTime` to avoid old semantics
     leaking back into the public shape.
4. Update HTTP projection tests only where they compare full JSON; projection should pass model
   shape through rather than rewrite it.
5. Update sample tests/docs/help assertions for the new `.meta` envelope.
6. Update type tests that construct `t.Files.Manifest` literals.

### TMIND risks

- Breaking clients: this is a contract shape change. Decision: keep `sys.files.manifest:v1` because
  this surface is still pre-release green-field.
- Accidental HTTP-only rewrite: resolved by changing the Files model/backings; all command
  transports return the same manifest contract.
- Dist timestamp unit drift: resolved by preserving `DistPkg.build.time` as Unix epoch milliseconds
  (`t.UnixTimestamp`), not ISO text.
- Over-meta: resolved by keeping actual payload data (`entries`, optional `content`) at root.

### Verification additions

- Model tests assert exact `.meta` shape for fs, memory, and static/dist manifests.
- Static/dist test asserts `.meta.dist.build.time === dist.build.time`.
- Paging tests assert `.meta.page.cursor` is a manifest cursor and `.meta.page.truncated === true`.
- HTTP projection/sample tests assert the GET JSON equals the direct `files:manifest` command
  result.

## Acceptance checks

Landed baseline:

- [x] `/files` remains only the default base path.
- [x] Shared Files projection derives manifest path from the effective base path.
- [x] `GET <base>/manifest` returns canonical `Files.Manifest` JSON.
- [x] Non-GET on the manifest path returns `405`.
- [x] WebSocket facade does not install/report manifest projection when manifest capability is
      false.
- [x] `server.status().urls` reports WebSocket first and HTTP manifest second.
- [x] HTTP Cmd sample reports command URL first and manifest URL second.
- [x] Direct WebSocket startup output preserves owner URL order.
- [x] Cell startup output prints both URLs without Files-specific logic.
- [x] Narrow server tests pass.
- [x] Narrow Cell formatter tests pass.
- [x] `deno task check` passes for touched packages.

Follow-up refinement:

- [x] Manifest version is `sys.files.manifest:v1` across the Files type contract and all backings.
- [x] HTTP manifest projection maps known Files command failures to appropriate HTTP statuses and
      never crashes the host server.
- [x] HTTP Cmd sample computes/saves `dist.json` before startup and serves static/dist-backed Files
      metadata.
- [x] HTTP Cmd sample manifest entries assert `size` and `hash` where dist metadata provides them.
- [x] WS/live filesystem manifest entries expose `size` where stat metadata is available.
- [x] WS sample remains live-filesystem backed and does not compute synthetic hashes.
- [x] Manifest entry field remains `size`, never `bytes`.

## Verification record

The follow-up refinement included model because the manifest version and entry metadata are model
contract/backing concerns.

From `code/sys.model/model`:

```sh
deno task test --trace-leaks ./src/m.files ./src/m.files.fs ./src/m.files.memory ./src/m.files.static
deno task check
```

From `code/sys/server`:

```sh
deno task test --trace-leaks ./src/m.server.websocket ./src/m.server.files ./-sample/files.http.cmd ./-sample/files.ws
deno task check
```

From `code/sys/cell`, only if service status formatting is touched again:

```sh
deno task test --trace-leaks ./src/m.cli/-test/-fmt.services.test.ts
deno task check
```

If server help bundles are edited, run the package prep task from `code/sys/server`:

```sh
deno task prep
```
