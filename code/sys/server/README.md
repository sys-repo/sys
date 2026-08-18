# @sys/server

`@sys/server` provides bounded HTTP, WebSocket, and verified file-serving primitives, plus lifecycle
endpoints for `@sys/cell` composition.

Callers own content, artifact selection, command grammar, authorization, and trusted state. The
package owns the network, verification, and lifecycle boundaries declared by each primitive.

## Choose a surface

- **`BootstrapStatus`** — show finite caller-owned status, then redirect once.
- **`Dist.materialize()`** — acquire one caller-selected manifest under an exact SHA-256 pin.
- **`DistServer.start()`** — host one externally pinned, continuously verified Dist.
- **`DistServer.Local.start()`** — host one locally observed build without claiming external
  authenticity.
- **`DistService` / `FilesWebSocketService`** — let `@sys/cell` own configured service lifecycles.
- **`WebSocketServer`** — bind application-owned command handlers to a managed transport.

## Inspect the package DSL

```sh
deno run -ER jsr:@sys/server --help
deno run -ER jsr:@sys/server dsl
deno run -ER jsr:@sys/server dsl websocket
deno run -ER jsr:@sys/server dsl websocket.cmd --format skill
```

## Host inert bootstrap status

`BootstrapStatus` is a temporary, read-only waiting room for application startup. Open its
unguessable loopback URL immediately; it serves bounded caller-defined status until the trusted
application origin is ready, then redirects there.

```ts
import { BootstrapStatus } from 'jsr:@sys/server/bootstrap/status';

type ApplicationHost = {
  readonly origin: string;
  readonly finished: Promise<void>;
};

async function runSession(startApplication: () => Promise<ApplicationHost>): Promise<void> {
  const bytes = new TextEncoder().encode('<!doctype html><p>Preparing...</p>');
  let readyOrigin: string | undefined;

  await using status = await BootstrapStatus.start({
    pages: [{ key: 'preparing', bytes }],
    resolve() {
      if (readyOrigin) return { kind: 'redirect', origin: readyOrigin };
      return { kind: 'page', key: 'preparing' };
    },
  });

  console.info(status.url);
  const application = await startApplication();
  readyOrigin = application.origin;
  await application.finished;
}
```

`startApplication` is caller-owned and must settle only after the application origin is trusted.
`resolve` reads the local `readyOrigin` once per admitted request. The initializer's `await` waits
for status startup; `await using` registers asynchronous disposal at scope exit rather than pausing
the body. `application.finished` keeps that scope—and therefore the status host—alive for the
session. On any lexical exit, disposal closes the status host before `runSession` settles.

Startup copies every page before binding:

| Input     |                   Limit |
| --------- | ----------------------: |
| Pages     |                    1–16 |
| Page key  | 1–128 UTF-16 code units |
| One page  |                 256 KiB |
| All pages |                   1 MiB |

The HTTP boundary is deliberately inert:

- only the exact random capability URL admits `GET` and `HEAD`;
- wrong `Host` authority and cross-site Fetch Metadata are rejected before `resolve`;
- redirects are `303` to one exact, distinct HTTP numeric-loopback origin;
- invalid projections and resolver failures become fixed sanitized responses;
- every response is `no-store`, sets no cookies, grants no CORS authority, and denies scripts,
  workers, frames, forms, and remote resources;
- requests cannot mutate state, retry work, select a source, or supply redirect authority.

Startup reads required own-data fields and copies accepted bytes into package-owned storage. It
refuses caller lifecycle or capability fields, accessor-backed required fields, proxies, and shared
buffers. The returned handle exposes no application or raw listener. Call `close()` explicitly, or
use `await using` for lexical shutdown.

At module initialization, `BootstrapStatus` captures its Promise and scheduler substrate. Startup
rejects later Promise drift around listener binding and sanitizes lower lifecycle failures. A thrown
startup error is never treated as proof that no listener exists: private authority pursues shutdown
and remains retained for the process lifetime when termination cannot be proved.

## Materialize a checksum-pinned Dist

A Dist is a directory whose `dist.json` declares every payload path, byte length, and checksum.
`Dist.materialize()` settles one caller-selected manifest as a sealed, verified local generation.
The caller supplies its URL and exact SHA-256 pin; materialization neither discovers nor advances a
release.

The target is `<storeDir>/<integrity>`:

```text
manifest URL + exact dist.json SHA-256 + explicit policy
  → authenticate manifest bytes
  → fetch declared assets into a private stage
  → verify the complete stage
  → publish without replacing an existing generation
  → clear write bits
  → verify the visible generation again
```

The result states what settled:

- **`existing`** — a valid generation already occupied the target; this attempt claims no
  publication.
- **`promoted`** — this attempt published its stage and verified the visible generation.
- **`failed`** — no usable generation settled; inspect `stage`, `reason`, `cleanup`, and
  `publication`.

Every success carries independent `verification` and `seal` evidence. Verification proves the exact
`dist.json` matched its pin and the visible tree matched the complete manifest. Sealing proves every
write bit was clear, clearing write bits when necessary. Both describe the returned directory at
settlement time, not immunity from later direct mutation.

Materialization holds an exclusive Rooted lease while deciding and settling the visible target. An
absent target releases that lease during network and private-stage work, then reacquires it for
publication, sealing, and final verification. Coordination extends only to participants using the
same Rooted protocol; direct filesystem authority remains outside it.

A valid but unsealed existing generation is sealed and verified again without source requests or
credential callbacks. An invalid occupied generation is retained and refused—not sealed, repaired,
replaced, or removed. If the host cannot prove the required identity or permission state,
materialization fails rather than returning an unsealed success.

Failures expose stable sanitized fields, not credentials, absolute paths, or raw host causes.
`cleanup` describes private-stage cleanup; `publication` separately records visible target truth. A
published generation is never described as rolled back because later settlement failed.

Materialization does not select a mutable current version, enforce replay policy, activate files, or
provide rollback. A seal is point-in-time mode evidence—not a sandbox, ACL guarantee,
hostile-process boundary, retention lock, or durability claim.

## Host a verified Dist

`DistServer` verifies before listening and at the byte boundary. Startup verifies the complete Dist;
each `GET` or `HEAD` reads the declared byte count, checks its checksum, and returns bytes only when
both match.

The authority is explicit:

- **`DistServer.start()`** — the caller supplies the exact SHA-256 of `dist.json`.
- **`DistServer.Local.start()`** — startup derives integrity from local `dist.json`, then verifies
  the complete tree without claiming external authenticity.

```ts
import { DistServer } from 'jsr:@sys/server/dist';

const integrity = 'sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const server = await DistServer.start({
  dir: `/srv/example/dist/${integrity}`,
  integrity,
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

The default HTTP boundary is closed:

- the listener accepts only loopback hostnames;
- `Host` must match an admitted loopback authority, otherwise the response is `421`;
- only manifest-declared files are addressable;
- `/` maps only to authenticated `index.html`; there is no SPA fallback;
- unsafe paths and range requests are refused;
- responses are `no-store`, and no CORS authority is granted.

Verification is not a permanent trust claim. Every admitted read verifies the exact bytes again, so
post-start mutation cannot silently become a successful response.

### Browser authority

Generic Dist hosting applies no browser-runtime policy. Select `browserPolicy` when verified bytes
will execute in a browser:

```ts
browserPolicy: {
  kind: 'verified-loopback',
  dedicatedWorkers: [],
  serviceWorker: { kind: 'deny' },
}
```

This mode requires numeric loopback and one exact `Host`. It applies fixed CSP, framing, referrer,
MIME, cross-origin, and `no-store` headers to success and error responses. Dedicated-worker and
Service Worker authority are separate and explicit; selected assets must exist in the verified Dist.
Cross-site Fetch Metadata is rejected when present, while missing metadata remains compatible with
direct clients.

Browser policy constrains execution of already verified bytes. It does not authenticate a caller,
make the origin public, or strengthen the artifact pin.

### Compose the Dist lifecycle with `@sys/cell`

Use `DistService` when `@sys/cell` should load strict YAML and own lifecycle:

```yaml
services:
  - name: neutral-dist
    use: DistService
    from: 'jsr:@sys/server/dist/service'
    config: ./-config/@sys.server.dist/neutral.yaml
    timeout: 15000
```

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

`dir` is confined lexically to the service `cwd`; pinned verification then rejects symlinked or
changed content. YAML may select the display name, loopback hostname, port, and verification limits.
Complete verification runs inside the service startup timeout. `@sys/cell` owns that timeout,
startup output, and shutdown.

## Expose read-only Files over WebSocket

`FilesWebSocketService` gives `@sys/cell` a read-only Files-over-WebSocket lifecycle endpoint. It
exposes typed Files commands and, when explicitly enabled, live watch observations.

```yaml
services:
  - name: sample:files
    use: FilesWebSocketService
    from: 'jsr:@sys/server/files/service'
    config: ./-config/@sys.server.files/shell.yaml
```

```yaml
name: sample:files
root: ./-sample/app
path: /files
port: 5050
watch: true
policy: '**'
```

`root` is confined lexically to the service `cwd`. Defaults are `path: /files`, `policy: '**'`, and
`watch: false`; choose a narrower policy when clients need less. Watch grants observation, not
mutation.

The endpoint uses `FilesServer.WebSocket.create(...)`, bridges the `@sys/cell` lifecycle through
`until`, and leaves terminal rendering to `@sys/cell`. Files policy bounds paths and capabilities;
it does not authenticate callers. Keep the default loopback listener or add authenticated admission
before wider exposure.

## Serve typed WebSocket commands

`WebSocketServer` binds an `@sys/event/cmd` grammar to WebSocket upgrades. It owns listening,
transport binding, status, active-socket cleanup, and lifecycle. Applications own commands,
handlers, admission, and authorization.

```ts
import { Cmd } from 'jsr:@sys/event/cmd';
import { WebSocketServer } from 'jsr:@sys/server/websocket';

type Name = 'hello';
type Payload = { hello: { name: string } };
type Result = { hello: { message: string } };
type Event = { hello: never };

const ns = 'docs.example';
const cmd = Cmd.make<Name, Payload, Result, Event>({ ns });
const server = WebSocketServer.create<Name, Payload, Result, Event>({
  path: '/rpc',
  cmd: {
    ns,
    handlers: { hello: ({ name }) => ({ message: `Hello, ${name}.` }) },
  },
});

const ws = new WebSocket(server.url);
try {
  await new Promise<void>((resolve) => {
    ws.addEventListener('open', () => resolve(), { once: true });
  });

  const client = cmd.client(Cmd.Transport.fromWebSocket(ws), { timeout: 1_000 });
  try {
    const response = await client.send('hello', { name: 'Ada' });
    console.info(response.message);
  } finally {
    client.dispose();
  }
} finally {
  ws.close();
  await server.close('example.complete');
}
```

`create()` is silent with caller-owned lifecycle. `start()` adds hosted startup reporting and
optional keyboard controls; process-signal binding is opt-in with `lifecycle: 'process'`. Both
return the same service-compatible handle.

Typed transport is not authentication. The default server binds to an ephemeral loopback port and
admits matching WebSocket upgrades. Use `accept` for request admission, enforce command authority in
application handlers, and never treat TypeScript types as runtime identity or permission proof.
