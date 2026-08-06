# @sys/server

System primitives and entrypoint surfaces for server packages.

[dsl]: https://en.wikipedia.org/wiki/Domain-specific_language

<p>&nbsp;</p>

## Usage

Read the package [DSL][dsl] before using, changing, or composing server primitives:

```sh
deno run -ER jsr:@sys/server --help
deno run -ER jsr:@sys/server dsl
deno run -ER jsr:@sys/server dsl websocket
deno run -ER jsr:@sys/server dsl websocket.cmd --format skill
```

#### Checksum-pinned Dist materialization

`jsr:@sys/server/dist` materializes an externally pinned `dist.json` as an integrity-addressed local
generation without choosing product or activation policy:

```text
manifest URL + independent exact-byte checksum + finite policy
  → bounded manifest and asset acquisition
  → confined staging and no-clobber promotion
  → fresh verification of the final generation directory
```

Every `existing` or `promoted` result carries verification evidence produced against its exact
returned directory. A `failed` result reports stable stage, reason, cleanup, and any visible
publication truth without exposing paths, credentials, or raw host causes.

This surface does not discover a checksum, choose a mutable current version, enforce replay policy,
or activate files. Operator-owned configuration and optional mutable projection belong to
`jsr:@sys/tools/pull`.

#### Host a checksum-pinned Dist

`DistServer` serves one local Dist. Before opening a listener, it checks the exact `dist.json` bytes
against the caller's SHA-256 pin and verifies every declared file. If any check fails, no listener
opens.

For each `GET` or `HEAD`, the server finds the path in the verified manifest, reads exactly the
declared number of bytes, checks their checksum, and returns them only when both checks pass. The
server binds only to loopback, serves no undeclared files, rejects Range requests, disables caching,
and sends no CORS permission. It admits only requests whose `Host` exactly matches an admitted
loopback authority for the listener, answering `421` otherwise, and maps `/` only to authenticated
`index.html` without an SPA fallback.

Start and stop the server directly through its returned lifecycle:

```ts
import { DistServer } from 'jsr:@sys/server/dist';

const server = await DistServer.start({
  dir: '/srv/example/dist/sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  integrity: 'sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  limits: {
    manifestBytes: 1048576,
    entries: 1000,
    fileBytes: 16777216,
    totalBytes: 67108864,
  },
});

try {
  console.info(server.origin);
} finally {
  await server.close('example.complete');
}
```

Use `DistService` when Cell should load the configuration and own shutdown:

```yaml
services:
  - name: neutral-dist
    use: DistService
    from: 'jsr:@sys/server/dist/service'
    config: ./-config/@sys.server.dist/neutral.yaml
    timeout: 15000
```

The service reads strict YAML:

```yaml
name: neutral-dist
dir: ./.dist-store/sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
integrity: sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
limits:
  manifestBytes: 1048576
  entries: 1000
  fileBytes: 16777216
  totalBytes: 67108864
hostname: 127.0.0.1
port: 0
```

`integrity` is the SHA-256 hash of the exact `dist.json` bytes. `dir` is resolved lexically against
the service `cwd` and may not escape it; pinned verification rejects symlinked escapes. YAML may
choose the display name, loopback host, port, and verification limits. Cell controls startup output
and shutdown.

Startup verifies the complete Dist. This work counts against Cell's 10-second default startup
timeout; set `timeout:` on the service descriptor when a larger Dist needs more time.

#### Files WebSocket service endpoint

Use `FilesWebSocketService` from `jsr:@sys/server/files/service` when Cell should own a bounded
Files-over-WebSocket service lifecycle.

```yaml
services:
  - name: sample:files
    use: FilesWebSocketService
    from: 'jsr:@sys/server/files/service'
    config: ./-config/@sys.server.files/shell.yaml
```

Service config is strict, schema-backed YAML:

```yaml
name: sample:files
root: ./-sample/app
path: /files
port: 5050
watch: true
policy: '**'
```

`root` resolves relative to the service `cwd` and may not escape it. Defaults are `path: /files`,
`policy: '**'`, and `watch: false`. The endpoint accepts Cell `silent` args for compatibility, but
calls `FilesServer.WebSocket.create(...)`; hosted output, keyboard, and process signal behavior
remain `start(...)` concerns.

#### WebSocket Cmd transport

Use `WebSocketServer` to bind typed [`@sys/event/cmd`](https://jsr.io/@sys/event/doc/cmd) handlers
to WebSocket upgrades. `@sys/server` owns upgrade, transport binding, status, and lifecycle;
applications own command grammar and handlers.

Define the command grammar, then start the server with handlers.

```ts
import { Cmd } from 'jsr:@sys/event/cmd';
import { WebSocketServer } from 'jsr:@sys/server/websocket';

type Name = 'hello' | 'count';
type Payload = { hello: { name: string }; count: { to: number } };
type Result = { hello: { msg: string }; count: { done: true } };
type Event = { hello: never; count: { tick: number } };

const ns = 'docs.example';
const cmd = Cmd.make<Name, Payload, Result, Event>({ ns });
const server = WebSocketServer.create<Name, Payload, Result, Event>({
  path: '/rpc',
  cmd: {
    ns,
    handlers: {
      hello: ({ name }) => ({ msg: `Hello, ${name}.` }),
      count({ to }, ctx) {
        for (let tick = 1; tick <= to; tick++) ctx.emit({ tick });
        return { done: true };
      },
    },
  },
});
```

From a WebSocket client, adapt the socket and call the typed commands.

```ts
const ws = new WebSocket(server.url);
await new Promise<void>((resolve) => {
  ws.addEventListener('open', () => resolve(), { once: true });
});

const endpoint = Cmd.Transport.fromWebSocket(ws);
const client = cmd.client(endpoint, { timeout: 1_000 });
try {
  const res = await client.send('hello', { name: 'Ada' });
  console.info(res.msg);

  const stream = client.stream('count', { to: 3 });
  const sub = stream.onEvent((e) => console.info(e.tick));
  await stream.done.finally(() => sub.dispose());
} finally {
  client.dispose();
  ws.close();
}
```

The returned server handle is also a service handle:

- `server.status()` returns stable service facts for tools, logs, and UIs.
- `server.close(reason?)` and `server.dispose(reason?)` stop the service and active sockets.
- The handle implements [`t.Service.Handle`](https://jsr.io/@sys/types/doc/~/Service.Handle).
