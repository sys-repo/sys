# Files HTTP sample plan

## Status

Planned. This is a plan-only landing for the S-tier implementation pass.

## Intent

Add a pedagogic middle sample between the existing Files sample poles:

```text
files.static     -> snapshot/publication over static HTTP
files.http       -> dynamic unary Files Cmd over HTTP JSON
files.websocket  -> live Cmd + watch over WebSocket
```

The goal is DX optics and reality mapping, not API expansion. The new sample should make the
transport surface visible enough that a user can see why static HTTP, unary HTTP Cmd, and WebSocket
are different lanes for the same bounded Files command grammar.

## BMIND read evidence

Fresh-pass files inspected for this plan:

- `code/sys/server/deno.json`
- `code/sys/server/-sample/files.websocket/-start.ts`
- `code/sys/server/-sample/files.websocket/-config.ts`
- `code/sys/server/-sample/files.websocket/common.ts`
- `code/sys/server/-sample/files.websocket/t.ts`
- `code/sys/server/-sample/files.websocket/-.test.ts`
- `code/sys/server/-sample/files.websocket/docs/README.md`
- `code/sys/server/-sample/files.static/-start.ts`
- `code/sys/server/-sample/files.static/-config.ts`
- `code/sys/server/-sample/files.static/common.ts`
- `code/sys/server/-sample/files.static/t.ts`
- `code/sys/server/-sample/files.static/-.test.ts`
- `code/sys/server/-sample/files.static/docs/README.md`
- `code/sys/server/-sample/files.static/dist/dist.json`
- `code/sys/server/src/m.server.files/t.ts`
- `code/sys/server/src/m.server.files/mod.ts`
- `code/sys/server/src/m.server.files/m.WebSocket/m.create.ts`
- `code/sys/server/src/m.server.files/m.WebSocket/m.start.ts`
- `code/sys/server/src/m.server.files/m.WebSocket/u.options.ts`
- `code/sys/server/src/m.server.websocket/t.ts`
- `code/sys/server/src/m.server.websocket/u/u.create.ts`
- `code/sys/server/src/m.server.websocket/u/u.start.ts`
- `code/sys/http/src/http.cmd/t.ts`
- `code/sys/http/src/http.cmd/m.handle.ts`
- `code/sys/http/src/http.cmd/m.client.ts`
- `code/sys/http/src/http.cmd/-test/-static-dist-files.test.ts`
- `code/sys/http/src/http.server/m.HttpServer/t.ts`
- `code/sys/http/src/http.server/m.HttpServer/m.Server.create.ts`
- `code/sys/http/src/http.server/m.HttpServer/u.start.ts`
- `code/sys.model/model/src/m.files/t.ts`
- `code/sys.model/model/src/m.files/m.Client/m.local.ts`
- `code/sys.model/model/src/m.files/m.Client/m.websocket.ts`
- `code/sys.model/model/src/m.files.fs/u/u.authority.ts`
- `code/sys.model/model/src/m.files.memory/u/u.authority.ts`
- `code/sys/event/src/m.cmd/t.ts`
- `code/sys/event/src/m.cmd/transport/u.from.WebSocket.ts`

Targeted proof already run before this plan:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/server
deno task test --trace-leaks ./-sample/files.websocket/-.test.ts ./-sample/files.static/-.test.ts
```

and HTTP Cmd transport proof:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/http
deno task test --trace-leaks ./src/http.cmd/-test/-static-dist-files.test.ts ./src/http.cmd/-test/-m.client.test.ts ./src/http.cmd/-test/-m.handle.test.ts
```

## Current sample structure

### `files.websocket`

Shape:

```text
-sample/files.websocket/
  -start.ts
  -config.ts
  common.ts
  t.ts
  -.test.ts
  docs/README.md
  docs/hello.{txt,json,yaml}
```

Runtime flow:

```text
Fs.Capability.Files.Readonly.live(Fs)
  -> Files.Fs.Readonly.live({ root, policy: readonly + watch })
  -> FilesServer.WebSocket.start({ files, path, lifecycle, keyboard, status })
  -> Files.Client.websocket(url)
```

What it teaches:

- WebSocket is the full Cmd transport lane.
- Files-specific consumers use `Files.Client.websocket(url)`.
- Live/read/watch capability belongs to the backing plus WebSocket transport.
- `FilesServer.WebSocket.start(...)` is the hosted sample UX seam.

Caveat:

- The sample test currently proves read access over the running sample.
- Full live watch and write/remove proofs live in server contract tests, not this sample.

### `files.static`

Shape:

```text
-sample/files.static/
  -start.ts
  -config.ts
  common.ts
  t.ts
  -.test.ts
  docs/README.md
  dist/dist.json
  dist/docs/README.md
  dist/hello.{txt,json}
```

Runtime flow:

```text
dist.json + static assets
  -> HttpStatic.start({ dir })
  -> Pkg.Dist.fetch({ origin })
  -> FilesStatic.fromDist({ dist, baseUrl, policy })
  -> Files.Client.local(backing)
  -> Files.ContentRef.text(url-ref)
```

What it teaches:

- Static publication mode is not a network Cmd server.
- The network serves immutable-ish assets and `dist.json`.
- `FilesStatic.fromDist(...)` reconstructs a bounded snapshot Files view locally.
- `files:read` returns URL content refs, and content is fetched separately.

## Transport reality for the new sample

### Files grammar

`@sys/model/files` owns the Files command grammar:

```text
files:capabilities
files:list
files:stat
files:read
files:write
files:remove
files:watch
files:manifest
```

Backings expose `{ capabilities, handlers }`. Transport owners bind those handlers; they do not own
Files policy, grammar, or backing semantics.

### WebSocket lane

`@sys/event/cmd` WebSocket transport adapts a raw WebSocket into a `t.Cmd.Endpoint` and supports the
full Cmd client handle: unary `send(...)` plus streaming `stream(...)`.

`Files.Client.websocket(url)` wraps that lane and returns a Files client handle with:

- `client.cmd.send(...)`
- `client.cmd.stream(...)`
- `client.readText(...)`
- socket lifecycle helpers

This is the correct lane for `files:watch`.

### HTTP Cmd lane

`@sys/http/cmd` owns HTTP JSON Cmd:

- `HttpCmd.handle(request, { path, cmd })` handles one HTTP request.
- `HttpCmd.handler(...)` creates a Fetch-compatible handler.
- `HttpCmd.client(...)` returns `t.Cmd.Client.Unary`.
- It is POST + JSON request/response.
- Handler `ctx.emit(...)` events are intentionally ignored.

Therefore the HTTP Files sample must teach unary Cmd only. It must not imply WebSocket-like watch
or streaming semantics.

### Static HTTP lane

Static HTTP does not host Files Cmd handlers. It serves `dist.json` and assets. The Files view is
reconstructed by the client from static metadata.

## S-tier decision

Add a server-local sample named `files.http`.

Do not add a new public `@sys/server/files/http` facade in this pass.

Reasons:

- The reusable HTTP transport primitive already exists at `@sys/http/cmd`.
- The reusable HTTP server primitive already exists at `@sys/http/server`.
- `@sys/server/files` is currently truthfully scoped to WebSocket.
- A new facade would be API expansion for a pedagogic gap.
- The sample can show the composition without making the composition a new noun.

## Planned sample

### Files

Create:

```text
code/sys/server/-sample/files.http/
  -start.ts
  -config.ts
  common.ts
  t.ts
  -.test.ts
  docs/README.md
```

Use a writable in-memory Files backing for the long-running sample:

```ts
const files = FilesMemory.Writable.create({
  dirs: ['docs'],
  files: {
    'hello.txt': 'hello from @sys/server HTTP Files sample\n',
    'hello.json': '{ ... }',
    'docs/README.md': '...',
  },
  policy,
});
```

Rationale:

- It keeps `deno task sample:files:http` mutation-safe.
- It demonstrates dynamic command state through write/read/remove.
- It avoids teaching users to mutate checked-in sample files.
- Real filesystem dynamic behavior is already proved in model/server contract tests.

If implementation review decides memory undercuts the visible realworld story, the fallback is a
temp real-FS root seeded at startup. Do not expose write/remove against checked-in sample docs.

### Route

Use one explicit Cmd endpoint:

```text
POST /files
```

Implementation shape:

```ts
const app = HttpServer.create({ static: false });

app.post(SampleFiles.path, (c) => {
  return HttpCmd.handle(c.req.raw, {
    path: SampleFiles.path,
    cmd: { ns: Files.Cmd.ns, handlers: files.handlers },
  });
});

const server = HttpServer.start(app, {
  hostname: '127.0.0.1',
  port: SampleFiles.port,
  name: SampleFiles.name,
  keyboard: true,
  status: {
    kind: 'files:http',
    urlPaths: [{ path: SampleFiles.path, label: 'files:http' }],
    details: [
      { label: 'files.transport', value: 'http.cmd:unary' },
      { label: 'files.capabilities', value: 'list,stat,read,write,remove,manifest' },
    ],
  },
});
```

Use `HttpServer.start(...)`, not `HttpStatic.start(...)`, because this sample is not serving static
assets.

### Client shape in docs/tests

Use `HttpCmd.client` typed to the Files Cmd maps:

```ts
const client = HttpCmd.client<t.Files.Cmd.Name, t.Files.Cmd.Payload, t.Files.Cmd.Result>({
  url: D.url,
  ns: Files.Cmd.ns,
  timeout: 1_000,
});

const read = await client.send(Files.Cmd.Name.read, { path: 'hello.txt' });
const write = await client.send(Files.Cmd.Name.write, {
  kind: 'text',
  path: 'docs/http.md',
  content: 'hello over HTTP\n',
});
```

Do not invent `Files.Client.http(...)` in this pass. If the typed `HttpCmd.client<Files...>` call
is too noisy after the sample lands, capture that as a follow-up model/client API decision.

## Deno task wiring

Update `code/sys/server/deno.json`:

- Add task:

```json
"sample:files:http": "deno run -P=sample-files-http ./-sample/files.http/-start.ts"
```

- Keep:

```json
"sample:files": "deno task sample:files:ws"
```

Do not silently change the default sample alias.

- Extend `check` to include `./-sample/files.http/*`.
- Add permission profile:

```json
"sample-files-http": {
  "read": true,
  "env": true,
  "net": true
}
```

If implementation chooses temp real-FS instead of memory, add `write: true` deliberately and document
why.

## Test plan

Add `-sample/files.http/-.test.ts` proving the running sample surface, not only helper logic.

Minimum assertions:

1. Start the sample server or equivalent sample app on an ephemeral port.
2. Create an `HttpCmd.client<Files.Cmd.Name, Files.Cmd.Payload, Files.Cmd.Result>` with `ns: Files.Cmd.ns`.
3. Assert capabilities:

```ts
{
  list: true,
  stat: true,
  read: true,
  write: true,
  remove: true,
  watch: false,
  manifest: true,
  fidelity: 'dynamic',
  encodings: ['utf8'],
}
```

4. Read an initial fixture file.
5. Write a text file.
6. Read the written file.
7. List/stat/manifest reflect the mutation.
8. Remove the file.
9. Stat/read after remove returns `CmdError.Remote` with the backing error message.
10. `files:watch` over this HTTP sample is explicitly unsupported; do not imply event streaming.

Use text payloads only. Byte payload fidelity remains a known transport hardening topic and should
not be made part of this sample's teaching promise.

## Documentation plan

Update sample docs to show the transport taxonomy:

```text
files.static     = generated publication/runtime mode over static HTTP
files.http       = dynamic unary Cmd mode over HTTP JSON
files.websocket  = live authoring/dev mode over WebSocket
```

Docs to update:

- New `-sample/files.http/docs/README.md`.
- Existing `-sample/files.static/docs/README.md` to include the third lane.
- Existing `-sample/files.websocket/docs/README.md` to include the third lane.
- Package `README.md` with a short sample section if it improves discoverability.

Avoid adding a `@sys/server` DSL chapter unless the implementation creates a new server primitive.
This sample composes `@sys/http/cmd` and `@sys/http/server`; it does not change `@sys/server/files`.

## Non-goals

- No new `FilesServer.Http` facade.
- No new `Files.Client.http(...)` adapter.
- No watch/streaming over HTTP JSON.
- No byte payload fidelity claim.
- No mutation of checked-in sample docs during `deno task sample:files:http`.
- No app router/auth/session/general server framework behavior.
- No generated `dist.json` path in the HTTP sample; static publication is already covered by `files.static`.

## Verification commands

From `code/sys/server`:

```sh
deno task test --trace-leaks ./-sample/files.http/-.test.ts
deno task test --trace-leaks ./-sample/files.websocket/-.test.ts ./-sample/files.static/-.test.ts ./-sample/files.http/-.test.ts
deno task check
```

If package README/docs only are changed, no help bundle prep is required. If any `src/m.help/yaml/*`
file is changed, run:

```sh
deno task prep
deno task test --trace-leaks ./src/m.help ./src/m.cli
```

## Acceptance bar

S-tier outcome means a reader can infer the correct transport choice without reading tests:

- Need static publication? Use `files.static` / `FilesStatic.fromDist(...)`.
- Need dynamic request/response Files commands over ordinary HTTP? Use `files.http` / `HttpCmd`.
- Need live watch/streaming? Use `files.websocket` / `Files.Client.websocket(...)`.

The final implementation should feel boring, truthful, and obviously scoped.
