# @sys/server

`@sys/server` provides bounded HTTP, WebSocket, and verified file-serving primitives, plus lifecycle
endpoints for `@sys/cell` composition.

Callers own content, artifact selection, command grammar, authorization, and trusted state. The
package owns the transport, storage coordination, verification, and lifecycle boundaries declared by
each primitive.

## Choose a surface

- **`BootstrapStatus`** (`/bootstrap/status`) — return an inert status page or an approved loopback
  redirect for each request.
- **`Dist.materialize()`** — prepare a sealed local Dist under an independent `sys.dist/v2` content
  pin.
- **`Dist.Generation.open()`** — hold one pinned generation under a shared store lease.
- **`DistServer.start()`** — host an externally pinned Dist; verify before listening and on each
  read.
- **`DistServer.Local.start()`** — host one locally observed build, including its exact verified
  manifest, without claiming external authenticity.
- **`DistService` / `FilesWebSocketService`** — let `@sys/cell` own configured service lifecycles.
- **`WebSocketServer`** (`/websocket`) — bind application-owned command handlers to a managed
  transport.

Use `/dist` for materialization and generation ownership, `/dist/server` for hosting, and
`/dist/service` or `/files/service` for Cell lifecycle endpoints. See the
[API documentation](https://jsr.io/@sys/server/doc) for their types and options.

## Host inert bootstrap status

`BootstrapStatus` is a temporary, read-only waiting room for application startup. Each admitted
request returns a supplied status page or redirects to the caller-approved application origin. An
already-open page does not update automatically: the browser must request the status URL again.

```ts
import { BootstrapStatus } from 'jsr:@sys/server/bootstrap/status';

type ApplicationHost = {
  readonly origin: string;
  readonly finished: Promise<void>;
};

async function runSession(startApplication: () => Promise<ApplicationHost>): Promise<void> {
  const bytes = new TextEncoder().encode(
    '<!doctype html><p>Preparing... Reload this page to check again.</p>',
  );
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
Reloading the status URL after that point receives the redirect; `resolve` is called on each
admitted request, not by a background poll or a one-shot transition.

`application.finished` keeps the status host alive for the session. `await using` closes it when the
scope exits, including when application startup fails.

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

### Startup failure

A startup error does not prove that no listener exists. The package attempts shutdown and retains
its private shutdown authority for the process lifetime when termination cannot be proved. Lower
lifecycle failures are sanitized. See [maintainer notes](#maintainer-notes) for the internal trust
requirements.

## Materialize a content-pinned Dist

A Dist is a directory whose `dist.json` declares every payload path, byte length, and checksum.
`Dist.materialize()` prepares or reuses a sealed, verified local generation. The caller chooses the
content by supplying a manifest URL and an independent `pin: { scheme: 'sys.dist/v2', digest }`. The
pin binds payload paths, checksums, and byte lengths—not root package labels, build metadata, or
JSON layout. Materialization neither discovers nor advances a release.

Each generation lives at `<storeDir>/sys.dist-v2/<pin.digest>`. When a download is needed:

```text
manifest URL + independent content pin + explicit policy
  → fetch and validate the manifest within the supplied limits
  → recompute the inventory digest and compare it with the pin
  → fetch declared assets into a private stage
  → verify the complete stage
  → publish without replacing an existing generation
  → clear write bits
  → verify the visible generation again
```

The result separates preparation from publication:

- **`existing`** — a generation was verified at the target; this attempt does not claim to have
  published it.
- **`promoted`** — this attempt published its stage and verified the visible generation.
- **`failed`** — preparation failed; inspect `stage`, `reason`, `cleanup`, and `publication`.
  Failure does not prove that nothing was published.

Every success carries two kinds of evidence:

- **`verification`** records a complete payload-tree check against the supplied content pin. Its
  `manifestChecksum` records the exact manifest bytes, allowing replacement to be detected during
  preparation even when the content pin is unchanged.
- **`seal`** records verified permissions. Materialization clears write bits where necessary.

Both describe the returned directory when preparation finishes. Neither prevents later direct
mutation.

Materialization holds an exclusive Rooted lease while inspecting and preparing the visible target.
If the target is absent, it releases that lease during network and private-stage work, then
reacquires it for publication, sealing, and final verification. The lease coordinates only callers
using the same Rooted protocol; it cannot restrict direct filesystem access.

A valid but unsealed existing generation is sealed and verified again without source requests or
credential callbacks. An invalid occupied generation is retained and refused—not sealed, repaired,
replaced, or removed. If the host cannot prove the required identity or permission state,
materialization fails rather than returning an unsealed success.

Failures expose stable, sanitized fields—not credentials, absolute paths, source URLs, response
bytes, headers, or raw host causes. `cleanup` describes private-stage cleanup; `publication` records
any known publication outcome. A later failure does not roll back a published generation. Optional
`releaseFailure` reports an inner-lease release failure separately from the primary `reason`.

A content-pin mismatch stops preparation before any asset is fetched. A valid existing generation
can be reused offline without refreshing its metadata. If another publisher wins the race, its
manifest may have different bytes for the same content pin. Accepting those different bytes requires
evidence of a distinct existing generation; a matching digest alone is insufficient.
Manifest-checksum-addressed stores are not a fallback.

Materialization does not select a mutable current version, enforce replay policy, activate files, or
provide rollback. A seal is point-in-time mode evidence—not a sandbox, ACL guarantee,
hostile-process boundary, retention lock, or durability claim.

## Own a pinned generation

`Dist.Generation.open()` materializes the pinned build and retains shared ownership of its store
target. Keep the owner alive while using the files so cooperating store resets cannot acquire
exclusive ownership. Use `materialize()` alone when preparation is enough; use `Generation.open()`
when the caller also needs that protection throughout a session. Neither prevents direct filesystem
mutation outside the Rooted protocol.

Supply `store: { root, target }`, `manifestUrl`, an independent content `pin`, and a `policy` with
finite `manifest`, `resources`, and `verification` limits. `root` is the store root; `target`
selects the package-store directory beneath it. The owner protects that target, while the
materialized files live in its `sys.dist-v2/<pin.digest>` generation directory.

```ts
import { Dist } from 'jsr:@sys/server/dist';
import type * as t from 'jsr:@sys/server/t';

async function useGeneration(
  args: t.Dist.Generation.Open.Args,
  use: (dir: string) => Promise<void>,
): Promise<void> {
  const result = await Dist.Generation.open(args);
  if (result.kind === 'failed') {
    console.info(result.phase, result.generation?.reason ?? result.reason, result.ownership);
    return;
  }

  await using owner = result.owner;
  console.info(owner.store);
  await use(result.generation.dir);
}
```

The callback must await all work that needs the lease. If it starts a host, it must keep that host's
serving lifetime inside the scope and close it before returning. Leaving the scope awaits release,
which can fail as described below.

For a complete executable setup, see the
[generation tests](./src/m.server.dist/-test/-generation.open.test.ts) and their
[shared fixture](./src/-test/u.fixture.dist.ts), which supplies a local source, pin and finite
acquisition policy. The tests cover cold materialization, offline reuse and exclusive-reset refusal
while an owner is alive.

On success, `generation` preserves the complete `existing` or `promoted` materialization result.
`owner.store` records the canonical root, normalized target and canonical store directory.

### Release and opening failures

Every call to `release()` returns the same Promise. Await it—or use `await using`—before assuming
the lease has been released. If release cannot be proved, that Promise rejects with a sanitized
error. Server retains the owner for the process lifetime and does not retry the underlying release.

A failed opening reports materialization and lease ownership separately:

- `generation`, when present, is the complete `Dist.Failed` returned by materialization. It appears
  only with phase `materialization` and has no duplicate Generation reason.
- Without `generation`, `reason` is `invalid-input`, `cancelled`, `busy`, `filesystem-failure`, or
  `execution-failure`.
- `ownership` is `not-acquired`, `released`, or `pending`. A pre-acquisition failure is
  `not-acquired`; every post-acquisition failure is `released` or `pending`.

`pending` is not proof of release or absence of ownership. Server retains the available ownership
evidence for the process lifetime. `Dist.Cleanup` describes private materialization stages, not the
outer lease.

### Opening cancellation

`until` can cancel opening; it does not end a returned owner's lifetime. Once opening succeeds, the
caller must release the owner. On a failed opening, inspect `ownership` even when the reason is
cancellation: cancellation alone does not prove lease release.

Generation opening does not check package identity, choose a workspace or release target, start a
listener, or apply browser policy. Those remain caller concerns. Acquisition mechanics and
cancellation-race handling are documented in [maintainer notes](#maintainer-notes).

## Host a verified Dist

`DistServer` verifies the complete Dist before listening. Each admitted `GET` or `HEAD` then reads
the requested file and checks its expected byte length and checksum. Only matching bytes can be
served; `HEAD` returns headers without a body.

The authority is explicit:

- **`DistServer.start()`** — the caller supplies an independent `sys.dist/v2` content pin.
- **`DistServer.Local.start()`** — startup checks the supported local inventory and complete tree
  without an independent expectation or a claim of external authenticity.

```ts
import { DistServer } from 'jsr:@sys/server/dist/server';

const pin = {
  scheme: 'sys.dist/v2',
  digest: 'sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
} as const;
const server = await DistServer.start({
  dir: `/srv/example/dist/sys.dist-v2/${pin.digest}`,
  pin,
  limits: {
    manifestBytes: 1048576,
    entries: 1000,
    fileBytes: 16777216,
    totalBytes: 67108864,
  },
  keyboard: true,
});

try {
  console.info(server.origin);
  await server.finished;
} finally {
  await server.close('example.complete');
}
```

Run this example in an interactive Deno terminal with a real, complete Dist and its independent
content pin; the illustrative hash is not release authority. It keeps serving until you press `Q` or
`Ctrl+C`, then awaits cleanup. Deno needs filesystem read and loopback network access. For
application-owned shutdown, disable `keyboard` and pass an `until` signal or call `close()`.

The narrow `@sys/server/dist/server` entry exposes hosting without loading Dist acquisition or
materialization. The aggregate `@sys/server/dist` entry remains available when one caller needs both
`Dist` and `DistServer`.

Pinned and Local hosting treat the manifest differently:

- `DistServer.start()` serves payload files only; `/dist.json` returns `404`.
- `DistServer.Local.start()` also serves `/dist.json`, using the exact bytes checked at startup.
  Every declared file is checksum-checked on read, and `/` serves the checked `index.html` when
  present. These checks prove local consistency, not independent authenticity.

The default HTTP boundary is closed:

- the listener accepts only loopback hostnames;
- `Host` must match an admitted loopback authority, otherwise the response is `421`;
- only the Local manifest route and manifest-declared files are addressable;
- `/` maps only to the verified inventory's `index.html`; there is no SPA fallback;
- unsafe paths and range requests are refused;
- responses are `no-store`, and no CORS authority is granted.

Verification is not a permanent trust claim. Every admitted read verifies the exact bytes again, so
post-start mutation cannot silently become a successful response.

### Browser authority

Generic Dist hosting applies no browser-runtime policy. Select `browserPolicy` when verified bytes
will execute in a browser:

```ts
import type * as t from 'jsr:@sys/server/t';

const browserPolicy = {
  kind: 'verified-loopback',
  dedicatedWorkers: [],
  serviceWorker: { kind: 'deny' },
} satisfies t.DistServer.BrowserPolicy.Input;
```

Pass this value as the `browserPolicy` start option. This mode requires numeric loopback and one
exact `Host`. It applies fixed CSP, framing, referrer, MIME, cross-origin, and `no-store` headers to
success and error responses. Dedicated-worker and Service Worker authority are separate and
explicit; selected assets must exist in the verified Dist. Cross-site Fetch Metadata is rejected
when present, while missing metadata remains compatible with direct clients.

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
dir: ./.dist-store/sys.dist-v2/sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
pin:
  scheme: sys.dist/v2
  digest: sha256-0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
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

## Expose read-only Files over WebSocket and HTTP

`FilesWebSocketService` gives `@sys/cell` a read-only Files-over-WebSocket lifecycle endpoint. It
exposes typed Files commands, an HTTP JSON manifest at `<path>/manifest`, and, when explicitly
enabled, live watch observations.

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
it does not authenticate callers. The HTTP route is `/files/manifest` by default and is a Files
inventory projection, not a content-pinned Dist manifest. Keep the default loopback listener or
protect **both HTTP and WebSocket admission** before wider exposure.

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

## Inspect the package DSL

The bundled DSL currently covers WebSocket transport, command grammar, lifecycle, service
composition and Files-over-WebSocket. It has no Dist or Bootstrap chapter, and its root still
directs static-file requests to stop. That guidance has not yet been reconciled with the exported
Dist surfaces; the DSL is not a complete operating guide to this package.

```sh
deno run -ER jsr:@sys/server --help
deno run -ER jsr:@sys/server dsl
deno run -ER jsr:@sys/server dsl websocket
deno run -ER jsr:@sys/server dsl websocket.cmd --format skill
```

## Maintainer notes

These internal assumptions explain the implementation, not additional caller configuration.

<details>
<summary>Bootstrap startup and Promise trust</summary>

At module initialization, `BootstrapStatus` captures the Promise implementation and scheduling
functions it uses. Startup rejects later changes to the Promise bindings it relies on, checking
before and after listener binding.

See the [Promise boundary](./src/m.server.bootstrap-status/u/u.promise.ts) and
[startup authority tests](./src/m.server.bootstrap-status/-test/-u.start.authority.test.ts).

</details>

<details>
<summary>Generation acquisition, settlement and retention</summary>

Opening prepares the store root and its ancestry, canonicalizes it, binds that exact root with
`create: false`, admits the root-relative target, and acquires a shared lease without waiting.
Materialization never starts without that outer lease.

Generation relies on trusted package-internal filesystem, Rooted, and materialization functions.
They must be non-Proxy callables that return exact, undecorated native Promises. Rooted acquisition
is assumed to be all-or-none: a failed acquisition must leave no lease behind.

Generation checks each returned Promise before awaiting it and never assimilates an arbitrary
thenable or decorated Promise. It treats the returned settlement evidence as hostile and validates
it independently. Release is confirmed only when the underlying operation fulfills with `undefined`;
rejection, another value or an unobservable settlement cannot prove release.

If materialization fails as cancellation arrives, opening preserves the complete, validated
`Dist.Failed` result. If materialization succeeds but cancellation is observed at the final opening
check, opening attempts lease release and reports cancellation. Once opening accepts success,
cancellation cannot revoke the owner.

Process-lifetime retention does not cover autonomous rejection from a decorated Promise or hidden
work by a replacement callable that violates this private contract.

See the [opening boundary](./src/m.server.dist/u.generation/u.open.ts),
[retention implementation](./src/m.server.dist/u.generation/u.retention.ts), and
[authority tests](./src/m.server.dist/-test/-generation.authority.test.ts).

</details>
