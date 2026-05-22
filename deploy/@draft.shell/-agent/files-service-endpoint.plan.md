# Files WebSocket service endpoint plan

Thread title: `/server-files-websocket-service-endpoint`

## Commit sequence

- [x] `f7f7e90b0 feat(server): add Files websocket service endpoint`
- [x] `71160cd59 docs(server): document Files websocket service endpoint`
- [x] `d335a55fc chore(draft.shell): compose shell files service in cell`
- [x] `dceea6c76 test(draft.shell): prove shell sample over files websocket`
- [x] `0d5e75815 test(draft.shell): polish sample websocket proof`
- [x] `1fa2c08dc refactor(draft.shell): remove temporary Files fixture plumbing`

## Purpose

Add a reusable `@sys/server/files` Cell lifecycle service endpoint that exposes a configured bounded
`Files<T>` root over WebSocket.

Draft shell exposed the seam, but the endpoint is not draft-shell-specific.

```text
/files-client-local-facade           → @sys/model/files client ergonomics
/server-files-websocket-service-endpoint → @sys/server/files service composition
```

## TMIND final review

This is not a pure Cell YAML move.

Cell already knows how to orchestrate lifecycle endpoints:

```yaml
services:
  - name: view
    use: ViteService
    from: 'jsr:@sys/driver-vite/service'
    config: ./-config/@sys.driver-vite/view.dev.yaml
```

But Cell can only import an existing endpoint and call `endpoint.start(args)`. The missing reusable
endpoint maps service YAML into a Files WebSocket service:

```text
Cell start args + service YAML
→ resolve bounded source root
→ build host FS capability
→ build Files.Fs.Readonly create/live backing
→ FilesServer.WebSocket.create(...)
→ Cell renders status and owns lifecycle
```

Best ownership is upstream in `@sys/server/files` as the Cell service entrypoint:

```text
@sys/server/files/service
```

This intentionally mirrors the existing service-entrypoint pattern:

```text
@sys/driver-vite/service  → ViteService
@sys/server/files/service → FilesWebSocketService
```

Rationale:

- `@sys/server/files` already owns `FilesServer.WebSocket.create/start`.
- The mapping from `{ root, policy, watch, path, port }` to `FilesServer.WebSocket.create(...)` is
  generic.
- Draft shell should only provide config selecting `./-sample/app` as the root.
- Keeping the endpoint generic prevents a draft-only adapter that later has to be moved/re-written.

Use `FilesServer.WebSocket.create(...)`, not `start(...)`, because Cell is the lifecycle/output
owner. `start(...)` is for standalone hosted programs/samples that own process signals, keyboard,
and direct startup output.

Do not forward `silent` to `create(...)`. Cell passes `silent: true` in service args, but `silent`
belongs to hosted `start(...)` options only. `create(...)` is already silent/caller-owned.

Keep `m.shell.structure` pure. Draft shell should consume this service through Cell config; no
`@sys/fs`, `@sys/server`, WebSocket, or Cell imports should enter `src/m.shell.structure/`.

## BMIND source check

Relevant source re-checked before landing this plan:

- `deploy/@draft.shell/-config/@sys.cell/cell.yaml`
  - currently only declares the `view` service.
  - no Files WebSocket service is started today.
- `code/sys/server/-sample/files.websocket/-start.ts`
  - proves the standalone primitive: `Files.Fs.Readonly.live(...)` then
    `FilesServer.WebSocket.start(...)`.
  - explicitly builds host authority with `Fs.Capability.Files.Readonly.live(Fs)`.
- `code/sys/server/-sample/files.websocket/-config.ts`
  - sample root/policy shape: docs root plus `Files.Policy.readonly('**', { watch: '**' })`.
- `code/sys/server/src/m.server.files/t.ts`
  - `FilesServer.WebSocket.create(...)` is caller-owned lifecycle.
  - `FilesServer.WebSocket.start(...)` is hosted startup.
  - `silent`, `keyboard`, and `lifecycle` are hosted `start(...)` concerns, not `create(...)`
    concerns.
- `code/sys/server/src/m.server.files/m.WebSocket/m.create.ts`
  - `create(...)` delegates to the generic WebSocket server without hosted process/keyboard
    behavior.
- `code/sys/cell/src/m.cell/t.ts`
  - Cell services receive `{ cwd, paths.config, silent, until }`.
- `code/sys/cell/src/m.cell/u.services/u.start.ts`
  - Cell passes `silent: true`, forwards `until`, stores owner handles, and closes handles via
    `close(...)`/`dispose(...)`.
- `deploy/@draft.shell/deno.json`
  - `dev` and `serve` already run through `@sys/cell start` with `net/read/env/run` dev permissions
    available.

## Upstream package shape

Landed in `f7f7e90b0 feat(server): add Files websocket service endpoint`:

```text
code/sys/server/src/m.server.files/m.Service/
├─ mod.ts
├─ t.ts
├─ common.ts
├─ m.start.ts
├─ u/
│  ├─ u.config.ts
│  ├─ u.config.parse.ts
│  ├─ u.config.policy.ts
│  ├─ u.config.resolve.ts
│  └─ u.config.schema.ts
└─ -test/
   ├─ -config.test.ts
   └─ -service.test.ts
```

Export added in `code/sys/server/deno.json`:

```json
{
  "exports": {
    "./files/service": "./src/m.server.files/m.Service/mod.ts"
  }
}
```

Endpoint binding name:

```ts
export const FilesWebSocketService = { start } as const;
```

## Service API

Exposes a Cell-compatible lifecycle endpoint:

```ts
export const FilesWebSocketService = {
  start(args) {
    const config = await loadConfig(args.paths.config);
    const root = resolveRoot(args.cwd, config.root);
    const policy = policyOf(config);
    const files = filesOf({ root, policy, watch: config.watch });

    return FilesServer.WebSocket.create({
      hostname: config.hostname,
      port: config.port,
      path: config.path,
      files,
      until: args.until,
      status: {
        name: config.name,
        root,
        config: args.paths.config,
      },
    });
  },
} as const;
```

Important details:

- `args.silent` is accepted from Cell but not forwarded to `create(...)`.
- `filesOf(...)` must construct the narrowed host FS capability explicitly:
  - live: `Fs.Capability.Files.Readonly.live(Fs)`
  - non-live: `Fs.Capability.Files.Readonly.create(Fs)`
- `watch: true` has two effects:
  - choose `Files.Fs.Readonly.live(...)` instead of `Files.Fs.Readonly.create(...)`;
  - include watch authority in policy, e.g. `Files.Policy.readonly('**', { watch: '**' })`.

## Config shape

Start small and concrete:

```yaml
name: shell:files
root: ./-sample/app
path: /files
port: 5176
watch: true
policy: '**'
```

Interpretation:

- `root` resolves relative to Cell root (`args.cwd`).
- `policy` defaults to `'**'` for readonly sample/source exposure.
- `watch: true` selects a live backing and adds watch policy authority.
- `path` is WebSocket route, default `/files`.
- `port` is the Files WebSocket port. Use a fixed draft-shell port initially; ephemeral port can be
  a later UI-discovery improvement.
- `name` feeds renderer-neutral status metadata.

## Draft shell Cell usage after upstream service lands

Draft shell should consume the upstream endpoint through config only:

```yaml
services:
  - name: shell:files
    use: FilesWebSocketService
    from: 'jsr:@sys/server/files/service'
    config: ./-config/@sys.server.files/shell.yaml

  - name: view
    use: Serve
    from: 'jsr:@sys/tools/serve'
    config: ./-config/@sys.tools.serve/view.yaml
    variants:
      dev:
        use: ViteService
        from: 'jsr:@sys/driver-vite/service'
        config: ./-config/@sys.driver-vite/view.dev.yaml
```

Draft shell config:

```text
-config/@sys.server.files/shell.yaml
```

with:

```yaml
name: shell:files
root: ./-sample/app
path: /files
port: 5176
watch: true
policy: '**'
```

## Startup/status expectation

After adding the service to Cell config, `deno task dev` should render two service blocks:

```text
service   shell:files
module    jsr:@sys/server/files/service
config    ./-config/@sys.server.files/shell.yaml
root      ./-sample/app
url       ws://127.0.0.1:5176/files

service   view
mode      dev
module    jsr:@sys/driver-vite/service
config    ./-config/@sys.driver-vite/view.dev.yaml
root      ./
url       http://localhost:5175/
```

Exact host formatting may follow existing WebSocket server conventions; the important part is that
Cell renders the owner `status()` snapshot from the returned handle.

## Minimal verification path

Completed upstream in `f7f7e90b0`:

1. Added `FilesWebSocketService` under `@sys/server/files/service`.
2. Added service config validation/loading tests in `@sys/server`.
3. Proved the service starts through the Cell-compatible `start(args)` shape.
4. Proved a websocket client can read a sample file:

```ts
const client = await Files.Client.websocket(url);
const read = await client.send(Files.Cmd.Name.read, { path: 'shell.yaml' });
```

5. Completed in draft-shell commits:
   - `d335a55fc chore(draft.shell): compose shell files service in cell`
   - `dceea6c76 test(draft.shell): prove shell sample over files websocket`
   - `0d5e75815 test(draft.shell): polish sample websocket proof`

```ts
const structure = ShellStructure.parse(read.content);
const resolved = ShellStructure.resolve(structure);
```

Once `/files-client-local-facade` lands, prefer `Files.Client.readText(...)` at call-sites, but do
not block this service endpoint on that upstream ergonomics work.

## Upstream tests added

- Config loader resolves `root` relative to Cell/service cwd and rejects root escapes.
- Config loader uses an `@sys/schema` TypeBox schema and rejects invalid service YAML.
- `watch: true` chooses live readonly backing and policy watch authority.
- `watch: false` or omitted chooses non-live readonly backing and no watch policy authority.
- Service endpoint returns a handle with `status()` and `close(...)`/`dispose(...)` compatible with
  Cell.
- Started service exposes a sample file over WebSocket.
- `FilesServer.WebSocket.create(...)` remains caller-owned and does not require/accept hosted
  `silent` semantics.
- WebSocket lifecycle test was hardened to avoid terminal keyboard `op_read` leaks.

## Draft shell checks after consuming the service

Completed in `d335a55fc`, `dceea6c76`, `0d5e75815`, and `1fa2c08dc`:

- Draft shell `cell.yaml` includes `shell:files` beside `view`.
- Draft shell config lives at `deploy/@draft.shell/-config/@sys.server.files/shell.yaml`.
- The test verifies Cell planning sees `FilesWebSocketService` from
  `jsr:@sys/server/files/service`.
- The sample WebSocket proof now lives at
  `deploy/@draft.shell/src/-test/-sample.websocket.test.ts`.
- The sample WebSocket proof derives runtime config from the checked-in service YAML and only
  rewrites the fixed port to `0` for test isolation.
- Started service exposes `-sample/app/shell.yaml` over WebSocket.
- Temporary raw Files Cmd fixture plumbing was removed from `m.shell.structure/-test`.
- `m.shell.structure` runtime graph still excludes `@sys/fs`, `@sys/server`, Cell, and WebSocket
  dependencies.

## Non-goals

- Do not add a draft-shell-local Files service endpoint if the generic upstream service is
  straightforward.
- Do not put `@sys/fs`, `@sys/server`, WebSocket, or Cell imports into `m.shell.structure`.
- Do not build UI consumption in this step.
- Do not solve the upstream Files client local facade here.
- Do not broaden beyond readonly source exposure until a concrete write/edit use-case appears.
- Do not solve static HTTP or dynamic HTTP Files transports in this thread.

## Suggested commit units

1. [x] `f7f7e90b0 feat(server): add Files websocket service endpoint`
   - service module, schema-backed config loader, lifecycle-compatible server tests.
   - validated with:
     - `cd code/sys/server && deno task check`
     - `cd code/sys/server && deno task test`
     - `cd code/sys/server && deno task dry`

2. [x] `71160cd59 docs(server): document Files websocket service endpoint`
   - documented service config YAML and Cell service binding in `code/sys/server/README.md`.
   - documented endpoint rules in `code/sys/server/src/m.help/yaml/dsl.files.websocket.yaml`.
   - regenerated `code/sys/server/src/m.help/-bundle/-bundle.json`.
   - validated with:
     - `cd code/sys/server && deno task help:bundle`
     - `cd code/sys/server && deno task check`
     - `cd code/sys/server && deno task test`
     - `cd code/sys/server && deno task dry`

3. [x] `d335a55fc chore(draft.shell): compose shell files service in cell`
   - added `shell:files` service entry to `deploy/@draft.shell/-config/@sys.cell/cell.yaml`.
   - added `deploy/@draft.shell/-config/@sys.server.files/shell.yaml`.

4. [x] `dceea6c76 test(draft.shell): prove shell sample over files websocket`
   - added Cell planning/config assertion for the `shell:files` service.
   - added WebSocket service sample read into `ShellStructure.parse/resolve`.
   - widened draft-shell test permission with `net` for the local WebSocket proof.
   - validated with:
     - `cd deploy/@draft.shell && deno test -P=test ./src/-test/-shell.files.websocket.test.ts`
     - `cd deploy/@draft.shell && deno task check`
     - `cd deploy/@draft.shell && deno task test`
     - `cd deploy/@draft.shell && deno task dry`

5. [x] `0d5e75815 test(draft.shell): polish sample websocket proof`
   - moved/renamed the proof to `deploy/@draft.shell/src/-test/-sample.websocket.test.ts`.
   - shortened the test body by pushing plumbing into local helpers.
   - made the runtime proof derive from checked-in service YAML and rewrite only `port` to `0`.
   - validated with:
     - `cd deploy/@draft.shell && deno test -P=test ./src/-test/-sample.websocket.test.ts`
     - `cd deploy/@draft.shell && deno task check`
     - `cd deploy/@draft.shell && deno task test`

6. [x] `1fa2c08dc refactor(draft.shell): remove temporary Files fixture plumbing`
   - removed `deploy/@draft.shell/src/m.shell.structure/-test/u.fixture.ts`.
   - removed `deploy/@draft.shell/src/m.shell.structure/-test/-sample.app.shell.test.ts`.
   - kept `m.shell.structure` pure and kept the WebSocket sample proof as the delivery/integration
     proof.
   - validated with:
     - `cd deploy/@draft.shell && deno task check`
     - `cd deploy/@draft.shell && deno task test`
     - `cd deploy/@draft.shell && deno task dry`

## Success criteria

`@draft/shell` Cell startup composes both:

```text
view service
shell files websocket service
```

and the sample source can flow through:

```text
-sample/app/shell.yaml
→ @sys/server/files/service
→ Files<T> websocket service
→ Files.Client.websocket(...)
→ ShellStructure.parse(...)
→ ShellStructure.resolve(...)
```

without compromising the purity boundary of `m.shell.structure`.
