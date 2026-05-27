# Files HTTP sample plan

## Commit sequence

- [x] `6c98eb8f6` sample(server): add Files HTTP Cmd sample
- [x] `d4ae9373e` feat(server): add Files HTTP Cmd help
- [x] `3dfcb6311` Update deno.json
- [x] `cdab0a5ef` refactor(server): align Files sample lane names
- [x] `c60b013b9` chore(workspace): refreshed 9 workspace packages (21 jsr:publish modules)
- [ ] plan(create): files HTTP sample reality record

## Status

Implemented. This file is now a historical reality record for the Files HTTP sample work, not a live
implementation plan.

Current sample lanes are:

```text
sample:files:http:static  → generated publication/runtime mode over static HTTP
sample:files:http:cmd     → dynamic readonly unary Files Cmd mode over HTTP JSON
sample:files:ws           → live Files Cmd + watch mode over WebSocket
```

Current paths are:

```text
code/sys/server/-sample/files.http.static/
code/sys/server/-sample/files.http.cmd/
code/sys/server/-sample/files.ws/
```

The original plan used `files.static`, `files.http`, and `files.websocket`. Those names are stale;
commit `cdab0a5ef` aligned the sample lane names to the current explicit transport naming.

## Final implemented reality

### HTTP Cmd lane

The implemented middle sample is `files.http.cmd`, not `files.http`.

Shape:

```text
-sample/files.http.cmd/
  -start.ts
  -config.ts
  common.ts
  t.ts
  -.test.ts
  docs/README.md
  docs/hello.{txt,json}
```

Runtime flow:

```text
./docs
  → Files.Fs.Readonly.create({ root, policy: readonly })
  → HttpServer.create({ static: false })
  → POST /files via HttpCmd.handle(...)
  → HttpCmd.client(...)
```

What it teaches:

- HTTP Cmd is unary POST + JSON request/response.
- It is a dynamic HTTP command lane, but the sample backing is readonly.
- It supports `capabilities`, `list`, `stat`, `read`, and `manifest`.
- It intentionally does not support `write`, `remove`, or `watch`.
- `GET /files` serves human help with a curl example.

The original plan expected a writable in-memory backing and write/remove assertions. That did not
land. The current implementation uses a real checked-in `./docs` corpus through
`Files.Fs.Readonly.create(...)`, keeping the sample mutation-safe and closer to visible files.

### Static HTTP lane

The implemented static lane is `files.http.static`.

Shape:

```text
-sample/files.http.static/
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
  → HttpStatic.start({ dir })
  → Pkg.Dist.fetch({ origin })
  → FilesStatic.fromDist({ dist, baseUrl, policy })
  → Files.Client.local(backing)
  → Files.ContentRef.text(url-ref)
```

What it teaches:

- Static HTTP is publication/runtime mode, not a network Cmd server.
- The HTTP server serves assets and `dist.json`.
- The Files view is reconstructed locally from static metadata.

### WebSocket lane

The implemented WebSocket lane is `files.ws`.

Shape:

```text
-sample/files.ws/
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
  → Files.Fs.Readonly.live({ root, policy: readonly + watch })
  → FilesServer.WebSocket.start({ files, path, lifecycle, keyboard, status })
  → Files.Client.websocket(url)
```

What it teaches:

- WebSocket is the live Files command lane.
- Files-specific consumers use `Files.Client.websocket(url)`.
- Live/read/watch capability belongs to the backing plus WebSocket transport.

## Deno task reality

`code/sys/server/deno.json` now defines:

```json
{
  "sample:files:ws": "deno run -P=sample-files-ws ./-sample/files.ws/-start.ts",
  "sample:files:http:cmd": "deno run -P=sample-files-http-cmd ./-sample/files.http.cmd/-start.ts",
  "sample:files:http:static": "deno run -P=sample-files-http-static ./-sample/files.http.static/-start.ts"
}
```

`check` includes all three sample folders:

```text
./-sample/files.ws/* ./-sample/files.http.cmd/* ./-sample/files.http.static/*
```

Permissions are split by lane:

```text
sample-files-ws
sample-files-http-cmd
sample-files-http-static
```

## Proof reality

The HTTP Cmd sample test currently proves:

- the sample process starts via `deno run -P=sample-files-http-cmd ./-sample/files.http.cmd/-start.ts`;
- `GET /files` returns text help with a curl example;
- `HttpCmd.client<t.Files.Cmd.Name, t.Files.Cmd.Payload, t.Files.Cmd.Result>` can call the sample;
- capabilities are readonly: `list`, `stat`, `read`, `manifest`; no `write`, `remove`, or `watch`;
- manifest/list/stat/read work against the checked-in docs corpus.

Current test file:

```text
code/sys/server/-sample/files.http.cmd/-.test.ts
```

Current verification command from `code/sys/server`:

```sh
deno task test --trace-leaks ./-sample/files.http.cmd/-.test.ts ./-sample/files.http.static/-.test.ts ./-sample/files.ws/-.test.ts
deno task check
```

## Non-goals that remained true

- No new `FilesServer.Http` facade.
- No new `Files.Client.http(...)` adapter.
- No watch/streaming over HTTP JSON.
- No byte payload fidelity claim.
- No mutation of checked-in sample docs during sample execution.
- No app router/auth/session/general server framework behavior.

## Final acceptance reality

A reader can infer the current transport choice from sample names and docs:

- Need static publication? Use `sample:files:http:static` / `FilesStatic.fromDist(...)`.
- Need unary request/response Files commands over HTTP JSON? Use `sample:files:http:cmd` / `HttpCmd`.
- Need live watch/streaming? Use `sample:files:ws` / `Files.Client.websocket(...)`.
