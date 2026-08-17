# @sys/server

`@sys/server` provides bounded HTTP, WebSocket, and file-serving primitives, plus service entry
points for Cell.

[dsl]: https://en.wikipedia.org/wiki/Domain-specific_language

## Usage

Read the package [DSL][dsl] before using, changing, or composing server primitives:

```sh
deno run -ER jsr:@sys/server --help
deno run -ER jsr:@sys/server dsl
deno run -ER jsr:@sys/server dsl websocket
deno run -ER jsr:@sys/server dsl websocket.cmd --format skill
```

### Host inert bootstrap status pages

`BootstrapStatus` exposes caller-owned status pages on one ephemeral numeric-loopback listener. It
copies every page before startup, generates a cryptographically random path capability internally,
and returns the resulting URL. Startup accepts at most 16 pages, 128 UTF-16 code units per key, 256
KiB per page, and 1 MiB across all copied page bytes. Admission reads only a fixed set of required
own data descriptors: inert extra properties are ignored without enumeration, while legacy lifecycle
and caller-capability keys are rejected without reading their values. Shared-buffer views are
rejected; accepted page bytes are copied once into owner-controlled storage. The capability grants
observation only: requests cannot mutate state, retry work, select a source, or provide redirect
authority.

```ts
import { BootstrapStatus } from 'jsr:@sys/server/bootstrap-status';

const encoder = new TextEncoder();
let readyOrigin: string | undefined;
const host = await BootstrapStatus.start({
  pages: [
    { key: 'preparing', bytes: encoder.encode('<!doctype html><p>Preparing.</p>') },
  ],
  resolve: () =>
    readyOrigin ? { kind: 'redirect', origin: readyOrigin } : { kind: 'page', key: 'preparing' },
});

try {
  console.info(host.url);
} finally {
  await host.close('example.complete');
}
```

Only exact-capability `GET` and `HEAD` requests are observationally admitted. A redirect is `303`
and only accepts an exact HTTP numeric-loopback origin distinct from the bootstrap origin. Unknown
paths remain fixed `404` responses; resolver or projection failure becomes a fixed sanitized `500`.
Every response is `no-store`, denies scripts, workers, framing, forms, and remote resources, removes
cookie/CORS authority, and rejects wrong `Host` or cross-site Fetch Metadata before state
resolution. The frozen returned handle exposes only `url`, `finished`, `disposed`, and idempotent
`close()`; the Hono application and raw listener remain private. Startup admits no caller-owned
lifecycle object. Package-owned promises sanitize lower lifecycle failures, and failed startup
retains private shutdown authority until listener termination is proven. The caller owns page
wording, finite projection keys, refresh markup, and trusted application state; the Server primitive
owns only constrained HTTP behavior and listener lifecycle.

### Materialize a checksum-pinned Dist

A Dist is a directory whose `dist.json` declares each payload file's path, byte length, and
checksum. `Dist.materialize()` turns a caller-supplied SHA-256 pin into one local generation
directory. It does not choose a release. It answers a narrower question: can this exact Dist be
settled here as a sealed, verified generation?

The target directory is `<storeDir>/<integrity>`, where `integrity` is the canonical manifest pin.
When that generation is absent, the path is:

```text
manifest URL + exact dist.json SHA-256 + explicit source and resource limits
  → authenticate the manifest bytes
  → fetch only declared assets into a private stage
  → verify the complete staged tree
  → publish without replacing an existing generation
  → clear write bits and verify the final directory
```

The result states what became true:

| Result     | Meaning                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------- |
| `existing` | A valid generation occupied the target; this attempt does not claim to have published it. |
| `promoted` | This attempt published its private stage and verified the published generation.           |
| `failed`   | No usable generation settled; inspect `stage`, `reason`, `cleanup`, and `publication`.    |

Every success carries two independent forms of evidence:

| Evidence       | What it proves                                                                                |
| -------------- | --------------------------------------------------------------------------------------------- |
| `verification` | The exact `dist.json` matched the pin, and the final directory matched its complete manifest. |
| `seal`         | Rooted verified that all write bits were clear across the tree, clearing them when necessary. |

Both fields describe the exact returned directory at settlement time. `seal.changed` says whether
sealing changed at least one entry. Verification does not say that the pin names the newest release
or should be activated. Sealing does not provide OS containment or protection from direct filesystem
authority.

During final settlement, `materialize()` holds one exclusive Rooted lease. It does not release that
lease between checking the target, sealing the visible generation, and performing the final
verification. Network transfer and private-stage work do not hold the target lease. The lease
coordinates processes that use the same Rooted protocol; it does not block code with direct
filesystem access.

A valid but unsealed existing generation is sealed locally and verified again without contacting the
source or invoking credential callbacks. An invalid occupied generation is rejected without being
sealed, repaired, replaced, or removed. If the host cannot provide the required identity or
permission evidence, materialization fails rather than returning an unsealed success.

A `failed` result uses stable, sanitized fields. It does not expose credentials, filesystem paths,
or raw host causes. Publication and private-stage cleanup are reported separately because a
published generation cannot be truthfully described as rolled back.

`materialize()` does not discover a checksum, select a mutable current version, enforce replay
policy, or activate files. Operator-owned selection and optional mutable projections belong to
`jsr:@sys/tools/pull`. A seal is point-in-time mode evidence—not a sandbox, retention lock,
hostile-process boundary, ACL guarantee, or sudden-power-loss durability claim.

### Host a checksum-pinned Dist

`DistServer` serves one local Dist. Before opening a listener, it checks the exact `dist.json` bytes
against the caller's SHA-256 pin and verifies every declared file. If any check fails, no listener
opens.

For each `GET` or `HEAD`, the server finds the path in the verified manifest, reads exactly the
number of bytes declared for that file, checks its checksum, and returns it only when both checks
pass.

The HTTP boundary is closed by default:

- The listener binds only to loopback.
- `Host` must exactly match an admitted loopback authority; otherwise the response is `421`.
- Only files declared by the verified manifest are served.
- `/` maps only to authenticated `index.html`; there is no SPA fallback.
- Range requests are rejected, caching is disabled, and no CORS permission is granted.

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

### Files WebSocket service endpoint

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
`policy: '**'`, and `watch: false`. The service calls `FilesServer.WebSocket.create(...)`, not
`start(...)`. It accepts Cell's `silent` setting for compatibility but does not own terminal output,
keyboard input, or process signals.

### WebSocket Cmd transport

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
