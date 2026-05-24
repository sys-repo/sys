# Files client local facade plan

## Final truth

Thread title: `/files-client-local-facade`

This plan is now an as-built record for the `Files<T>.Client.local` rollout. The implementation has
landed through these commits; the only remaining item is this documentation-plan commit.

```text
Files<T>.Client.local:
  [x] 68da168ce0cb37377e88ada988cc79e53cc0a8a2
      feat(model): add Files client handle facade with readText
  [x] 914d9fafce2cf5ed4d9f61d4bb7e211b34e1df20
      feat(event): add Cmd<T> local transport adapter
  [x] e247ec9737442e120664a7f8317aae5c83d8e752
      feat(model): add local Files client binding
  [x] d26e8bc06c35de6d70d653079253b8dbbb867a41
      test(server): migrate Files websocket clients to handle.cmd grammar
  [x] e7ac2012901d15c7c89cc8e5def5627ff55e89c7
      test(draft.shell): read shell sample through Files client
  [ ] pending
      docs(plan): add Files client local facade plan
```

As-built API truth:

- `Files.Client.local(backing, options?)` binds an in-process Files backing through the production
  `Cmd.Transport.local(...)` adapter and returns the same Files client handle grammar as other
  client constructors.
- `Files.Client.transport(endpoint, options?)` centralizes typed Files Cmd binding.
- `Files.Client.websocket(url, options?)` returns a Files client handle and keeps raw Cmd access at
  `client.cmd`.
- The humane client method currently exposed is only `readText(...)`.
- Raw command access intentionally remains available as `files.cmd.send(...)` /
  `files.cmd.stream(...)`.
- Consumer/sample paths now use `readText(...)`; server contract tests use `client.cmd.send(...)`
  and `client.cmd.stream(...)` when proving raw Cmd/WebSocket behavior.

## Prompt that exposed the seam

While proving `@draft/shell` can load an authored shell YAML through a Files-shaped source, the
clean test wanted to say:

```ts
const yaml = await Fixture.Files.readText({ root, path: SAMPLE });
```

But the fixture had to hide this implementation detail:

```ts
const backing = Files.Fs.Readonly.create({ ... });
const read = await backing.handlers[Files.Cmd.Name.read](
  { path },
  context(Files.Cmd.Name.read),
);
```

That is the smell. A ShellStructure test should not know how to invoke Files Cmd handlers directly,
and a real call-site should not need a local fixture to turn Files Cmd into a normal read operation.

## BMIND/STIER review

The missing layer is not a draft-shell API. The draft-shell test only exposed it.

The durable abstraction belongs in `@sys/model/files`:

```text
Files runtime/backing
→ raw Files Cmd client
→ filesystem-shaped Files client handle
```

The raw Cmd surface is correct and should remain available. It is the message-passing computer:
portable, transportable, namespace-aware, and stream-capable.

The missing STIER layer is not merely a static helper that hides `handlers[...]`. It is a small,
filesystem-shaped client handle that lets ordinary Files consumers read through any Files backing
without thinking about command envelopes, contexts, endpoints, or handler maps.

The target call-site for a filesystem-backed caller is:

```ts
import { Files } from '@sys/model/files/fs';

const backing = Files.Fs.Readonly.create({ fs, root, policy });
const files = Files.Client.local(backing);

const yaml = await files.readText('app.yaml');

files.dispose();
```

This should read naturally to someone familiar with Node, Deno, or `@sys/fs`: construct a bounded
filesystem-like handle, then call methods on that handle.

Be precise about surfaces: `Files.Fs` is not on the core `@sys/model/files` export. It exists on the
filesystem adapter export, `@sys/model/files/fs`, which composes the core Files model with the fs
backing constructors. Core client tests should prefer `FilesMemory.Readonly.create(...)` because the
facade only needs a structural runtime (`capabilities` + `handlers`), not a host filesystem.

The exact same conceptual move already exists for remote clients:

```ts
const files = await Files.Client.websocket(url);
```

`websocket(...)` hides raw WebSocket readiness and Cmd transport setup. `local(...)` should hide
in-process handler binding. Both constructors should return the same humane Files client shape.
Transport should change location, not the consumer grammar.

## Core architecture invariant

Keep these nouns distinct:

```text
backing/runtime  = authority + command handlers
cmd client       = raw message-passing surface
files client     = human filesystem-shaped facade over a cmd client
```

Do not collapse them.

- A backing owns authority and policy.
- A Cmd client owns transport and command grammar.
- A Files client owns consumer ergonomics.

The public facade must make the common path look like a bounded filesystem, while preserving an
explicit escape hatch for advanced Cmd users.

## Naming decision

Use `local` because it is legible against `transport`:

```ts
Files.Client.local(runtime);
Files.Client.transport(endpoint);
Files.Client.websocket(url);
```

- `local` means direct in-process binding to a Files runtime/backing.
- `transport` means bind to a generic Cmd endpoint.
- `websocket` remains a convenience constructor over a concrete transport.

`local` must not imply “local disk”. It must work for fs, memory, static, and future model backings.
The backing decides authority; the client constructor only decides binding.

Avoid `Fs.readText` for this layer. The operation is Files-model-level, not OS-filesystem-specific.
It should work for fs, memory, static, websocket, and future transports.

Avoid exposing `fromHandlers(...)` as the normal public shape. Handlers are exactly the
insider-baseball detail callers should not need to see. If a lower-level helper exists internally,
keep `local(runtime)` as the public constructor.

Avoid making `Files.Client.readText(client, path)` the primary surface. It hides handler plumbing,
but still makes the user think in "helper over client" terms. The normal shape should be object
method grammar:

```ts
const files = Files.Client.local(runtime);
const text = await files.readText(path);
```

## Public API shape

In `@sys/model/files`:

```ts
const files = Files.Client.local(runtime, options?);
const files = Files.Client.transport(endpoint, options?);
const files = await Files.Client.websocket(url, options?);

const text = await files.readText(path, options?);

files.cmd.send(Files.Cmd.Name.read, { path }); // structured/advanced escape hatch
files.dispose();
```

Suggested first implementation surface:

```ts
namespace Files {
  export namespace Client {
    type Lib = {
      local(runtime: Files.Backing.CmdSurface, options?: LocalOptions): Local;
      transport(endpoint: t.Cmd.Endpoint, options?: TransportOptions): Transport;
      websocket(url: t.StringUrl | URL, options?: WebSocketOptions): Promise<WebSocket>;
    };

    type Handle = t.Lifecycle & {
      readonly cmd: Files.Cmd.Client;

      readText(path: Files.String.Path, options?: ReadTextOptions): Promise<string>;
    };

    type Local = Handle;
    type Transport = Handle;

    type WebSocket = Handle & t.WaitableHandle & {
      readonly url: t.StringUrl;
      readonly finished: Promise<CloseEvent | undefined>;
      close(reason?: unknown): Promise<void>;
    };

    type ReadTextOptions = Omit<Files.Cmd.Read.Payload, 'path'>;

    type LocalOptions = Pick<t.Cmd.Client.Options, 'timeout'>;
    type TransportOptions = Pick<t.Cmd.Client.Options, 'timeout' | 'closeEndpoint'>;
    type WebSocketOptions = Pick<t.Cmd.Client.Options, 'timeout'> & {
      readonly protocols?: string | string[];
    };
  }
}
```

Notes:

- `Files.Client.local(...)` should accept the existing structural backing shape
  (`Files.Backing.CmdSurface`), not only fs-backed runtimes.
- `Files.Client.transport(...)` should centralize the current typed Cmd binding ceremony.
- `Files.Client.websocket(...)` should become a transport-specific opener that delegates to
  `Files.Client.transport(...)` after the socket is ready, then adds WebSocket metadata/lifecycle.
- The raw Cmd client remains available at `files.cmd`, not as the primary user grammar.
- `readText(...)` is the only facade method in this first pass. Future convenience methods must be
  earned by real call-sites and a fresh capability review.
- Do not make the Files client itself extend `Files.Cmd.Client` unless there is a stronger reason;
  direct inheritance puts `send(...)` and `stream(...)` back in the user's face.
- Do not let `Handle` ossify into a capability-lying god type. If write/remove/watch conveniences
  are added later, re-evaluate whether the facade needs capability parameters or readonly/writable
  handle splits before adding methods.

## Compatibility and migration

Changing `Files.Client.websocket(url)` from a raw Cmd client to a Files handle is an intentional
breaking change.

Current call-sites that do this:

```ts
const client = await Files.Client.websocket(url);
const read = await client.send(Files.Cmd.Name.read, { path });
```

must migrate by intent:

```ts
// Consumer/sample path: prove the humane facade.
const text = await client.readText(path);

// Raw Cmd contract path: prove the message grammar explicitly.
const read = await client.cmd.send(Files.Cmd.Name.read, { path });
const stream = client.cmd.stream(Files.Cmd.Name.watch, { path });
```

Do not preserve top-level `send(...)` / `stream(...)` just for compatibility unless the design is
reopened. Keeping those methods on the front door would blur the facade's purpose and make the
advanced escape hatch look like the normal path again.

## `readText(...)` semantics

The first facade method is only the humane text-value method:

```ts
const text = await files.readText('app.yaml');
```

It should:

- send the typed `files:read` command under the hood;
- return `result.content` for `kind: 'inline'`;
- preserve path and payload-level read options (`encoding`, `maxBytes`);
- treat `truncated: true` deliberately:
  - if the caller provided `maxBytes`, return the truncated content because the caller requested a
    bounded read;
  - if the caller did not provide `maxBytes`, throw a clear `FilesClientError` rather than silently
    returning partial file content;
- throw a clear `FilesClientError` when the backing returns `kind: 'ref'` because inline text is not
  available;
- wrap or normalize client-layer failures with Files client context when useful, without hiding the
  underlying cause.

A content-ref error should read like a domain error, not an assertion failure:

```text
Files.Client.readText: inline text unavailable for "app.yaml"; backing returned contentRef.
```

Do not add a public `files.read(...)` convenience method in this first pass. In normal OS-level FS
APIs, `read`/`readFile` implies bytes or text content; in the Files model, the structured read result
is a fidelity union (`inline | ref`). Keep that union on the explicit raw Cmd escape hatch until a
future method name earns its place:

```ts
const result = await files.cmd.send(Files.Cmd.Name.read, { path: 'app.yaml' });
```

This first pass should not introduce a broad `@sys/fs`-style `{ ok, exists, data, error }` result
surface. `readText(...)` should stay the small Deno/Node-shaped happy-path method unless a no-throw
result surface earns its own explicit name later.

## Implementation sketch

### 1. Shape the type surface first

Update the `Files.Client` namespace in the monolithic `m.files/t.ts` before runtime implementation.

Add:

- `Files.Client.Handle`
- `Files.Client.Local`
- `Files.Client.Transport`
- revised `Files.Client.WebSocket`
- `ReadTextOptions`
- `LocalOptions` / `TransportOptions` / revised `WebSocketOptions`

Keep the public namespace ordered with `Lib` first, then primary handle types, then options.

Type-plane invariant: `m.files/t.ts` stays runtime-free. `createHandle`,
`contentRefUnavailable`, and all `MessageChannel` glue live under `m.Client/`, not in the contract
plane.

### 2. Add a private handle composer

Create a small internal composer that turns a typed Files Cmd client into a filesystem-shaped handle:

```ts
const handle = createHandle(cmd, lifecycle?);
```

The handle owns:

- `cmd`
- `readText(path, options?)`
- `dispose()`

This avoids duplicating method wiring across `local`, `transport`, and `websocket`.

Use the canonical lifecycle primitive rather than a hand-rolled disposed flag. Add `Dispose` to the
local `m.files/common.ts` lane if needed:

```ts
export { Dispose } from '@sys/std/dispose';
```

`createHandle(...)` should create a `Dispose.lifecycle()`, subscribe once through that lifecycle,
and return `Dispose.toLifecycle(life, api)`. This gives idempotency, `disposed`, and `dispose$` from
the system primitive.

Lifecycle contract:

- `dispose()` is synchronous and idempotent.
- `dispose()` disposes the raw Cmd client first, so pending sends settle locally.
- `dispose()` then runs any extra owned lifecycle, such as the local host created by `local(...)`.
- WebSocket `close(reason?)` may await socket closure, but repeated `close(...)`, socket-finished
  disposal, and direct `dispose()` must be safe in any order.

### 3. Add `Files.Client.transport(...)`

Move the typed Cmd binding currently embedded in `m.Client/m.websocket.ts` behind a reusable
constructor:

```ts
const cmd = Cmd.make<
  t.Files.Cmd.Name,
  t.Files.Cmd.Payload,
  t.Files.Cmd.Result,
  t.Files.Cmd.Event
>({ ns: FilesCmd.ns }).client(endpoint, options);

return createHandle(cmd);
```

`transport(...)` returns a Files client handle, not a raw Cmd client.

### 4. Add `Files.Client.local(...)`

Bind a local Files runtime/backing to a typed client without exposing handler invocation.

Keystone: `Files.Backing.CmdSurface.handlers` already is `Files.Cmd.HandlerMap`, and
`Files.Cmd.HandlerMap` already is `Cmd.Handler.Map<...>`. The Cmd host can bind runtime handlers
verbatim; it supplies the command context (`id`, `signal`, `emit`, namespace/correlation path) that
the draft-shell fixture was previously forging by hand.

Preferred implementation path: use an in-process Cmd endpoint pair and host the runtime handlers on
one side while returning a Files client handle on the other.

Conceptually:

```ts
const cmdFactory = Cmd.make<
  t.Files.Cmd.Name,
  t.Files.Cmd.Payload,
  t.Files.Cmd.Result,
  t.Files.Cmd.Event
>({ ns: FilesCmd.ns });
const { port1, port2 } = new MessageChannel();
const host = cmdFactory.host(port1, runtime.handlers);
const cmd = cmdFactory.client(port2, options);
const files = createHandle(cmd, {
  dispose() {
    host.dispose();
    port1.close();
    port2.close();
  },
});
```

The returned local handle should dispose the client, dispose the host, and explicitly close both
`MessagePort`s. Do not rely only on `closeEndpoint: true` for local ports. Mirror the proven
in-process Cmd teardown already used by the automerge driver: dispose host/client, then close both
ports. Do not leak `handlers[...]`, `MessageChannel`, or command context creation to call-sites.

Use `MessageChannel` rather than a direct `handlers[name](payload, fakeCtx)` shim. A fake context may
be enough for unary reads, but it loses the real Cmd semantics: abort signal propagation,
stream-event `emit`, pending request cancellation, and the local `files.cmd.stream(...)` escape
hatch for live/watch-capable backings. A local binding should be the same Cmd grammar over a local
transport, not a special-case function call.

As-built note: the local transport primitive was promoted deliberately before the Files binding.
`Cmd.Transport.local({ factory, handlers, hostOptions? })` now owns the `MessageChannel` pair, host
binding, and idempotent port teardown as reusable production infrastructure. Files local binding uses
that adapter rather than maintaining private Files-only port-pair glue.

### 5. Update `Files.Client.websocket(...)`

After the WebSocket is open:

1. adapt it with `Cmd.Transport.fromWebSocket(ws)`;
2. call `Files.Client.transport(endpoint, { timeout, closeEndpoint: true })`;
3. return the same Files client handle with `url`, `finished`, and `close(...)` attached.

`websocket(...)` should not duplicate typed Cmd construction or read helper wiring.

### 6. Implement `readText(...)` on the handle

Define one closure-scoped `sendRead` binding for the internal command call. Expose only
`readText(...)` on the handle. Do not use `this`.

```ts
const sendRead = (path: t.Files.String.Path, options: t.Files.Client.ReadTextOptions = {}) => {
  return cmd.send(FilesCmd.Name.read, { path, ...options });
};

const readText: t.Files.Client.Handle['readText'] = async (path, options) => {
  const result = await sendRead(path, options);
  if (result.kind === 'inline') {
    if (result.truncated && options?.maxBytes === undefined) throw truncatedRead(path);
    return result.content;
  }
  throw contentRefUnavailable(path, result.contentRef);
};
```

Use the existing error lane in `m.Client/u.error.ts`. Add `contentRefUnavailable(...)` and
`truncatedRead(...)` beside `openError(...)`, and use the same `Err.std(..., { name:
'FilesClientError', cause? })` plus `Err.normalize(...)` pattern. Do not throw generic `Expected
inline` or `Unexpected truncated read` errors from production facade code.

Do not rename payload-level read options: `ReadTextOptions = Omit<Files.Cmd.Read.Payload, 'path'>`
should surface `encoding` / `maxBytes`, not the backing-construction option `maxReadBytes`.

## Tests

Add tests in `code/sys.model/model/src/m.files/-test/` or a local client test subtree if it becomes
large enough to earn one.

Minimum proof:

1. `Files.Client.local(...)` binds a `FilesMemory.Readonly.create(...)` runtime and
   `files.readText(...)` returns inline text.
2. The handle shape is intentionally small: lifecycle fields, `cmd`, and `readText(...)`; no public
   `files.read(...)` method exists in the first facade shape.
3. Consumer tests do not access `backing.handlers[...]` or construct command contexts.
4. `Files.Client.transport(...)` returns the same method-shaped handle over a Cmd endpoint.
5. `Files.Client.websocket(...)` still opens/closes correctly and returns the same method-shaped
   handle.
6. `files.cmd.send(...)` and `files.cmd.stream(...)` remain available as explicit raw Cmd escape
   hatches.
7. `local(...)` disposal closes the local client, local host, and both `MessagePort`s; repeated
   disposal is safe.
8. `websocket(...)` disposal is safe in all orders: `close(...)`, socket-finished disposal, and
   direct `dispose()` may race or repeat without leaking.
9. `readText(...)` throws a clear `FilesClientError` for `kind: 'ref'`.
10. `readText(...)` returns caller-requested truncated content when `maxBytes` is provided, and
    throws a clear `FilesClientError` for unexpected truncation without caller `maxBytes`.
11. Existing websocket consumers are migrated deliberately: samples/docs use `readText(...)`; raw
    Cmd/server contract tests use `client.cmd.send(...)` / `client.cmd.stream(...)`.

API shape tests should assert the top-level surface intentionally:

```ts
expect(Object.keys(Files.Client).sort()).to.eql(['local', 'transport', 'websocket']);
```

Handle shape tests should assert consumer grammar intentionally:

```ts
import { FilesMemory } from '@sys/model/files/memory';

const backing = FilesMemory.Readonly.create({ files: { 'app.yaml': '...' } });
const files = Files.Client.local(backing);
expect(await files.readText('app.yaml')).to.eql('...');
expect(Object.keys(files).sort()).to.eql(['cmd', 'dispose', 'dispose$', 'disposed', 'readText']);
expect(files.cmd).to.not.eql(undefined);
```

Leak discipline: every `local(...)`, `transport(...)`, and `websocket(...)` test must close the
handle in `finally`. `MessagePort` keeps the Deno event loop alive, so forgotten disposal will fail
under `deno task test --trace-leaks` as a runtime leak rather than a helpful assertion. The local
lifecycle test should also assert `files.disposed === true` after teardown.

## Draft-shell call-site cleanup

The draft-shell sample proof now uses the public Files client shape directly:

```ts
import { Files } from '@sys/model/files/fs';

const backing = Files.Fs.Readonly.create({
  fs: Fs.Capability.Files.Readonly.create(Fs),
  root,
  policy: Files.Policy.readonly('shell.yaml'),
});
const files = Files.Client.local(backing);

try {
  return await files.readText('shell.yaml');
} finally {
  files.dispose('test.cleanup');
}
```

The same test also reads the sample through `Files.Client.websocket(...).readText(...)` and asserts
that local and remote client reads return identical YAML before parsing with `ShellStructure`.

## Non-goals

- Do not create a `@draft/shell` public source API for this.
- Do not rename the raw Cmd grammar or hide it from advanced users.
- Do not make this fs-specific.
- Do not make `local` mean local disk.
- Do not expose handler maps, command contexts, MessageChannel ports, or endpoint glue as normal
  consumer concepts.
- Do not solve content-ref fetching, binary transport fidelity, HTTP watch semantics, or byte
  payload JSON representation in this thread. Those remain part of the broader Files transport
  fidelity plans.
- Do not turn this into a giant Files facade in one pass. Start with the seam the call-site proved:
  local client binding plus one `readText(...)` method.
- Do not add `read`, `stat`, `list`, `write`, `remove`, or `watch` convenience methods in this pass.
  Future facade methods must be earned by real call-sites and a fresh capability/type review.

## Success criteria

A consumer can write this without insider-baseball command plumbing:

```ts
import { Fs } from '@sys/fs';
import { Files } from '@sys/model/files/fs';

const fs = Fs.Capability.Files.Readonly.create(Fs);
const backing = Files.Fs.Readonly.create({
  fs,
  root,
  policy: Files.Policy.readonly('app.yaml'),
});
const files = Files.Client.local(backing);

try {
  const yaml = await files.readText('app.yaml');
} finally {
  files.dispose();
}
```

No consumer test should need:

```ts
backing.handlers[Files.Cmd.Name.read](...)
```

unless that test is explicitly testing Files runtime/authority internals.

The finished surface should feel like a bounded, transportable filesystem: same method grammar for
memory, filesystem, websocket, and future transports; Cmd remains available, but it is no longer the
front door for ordinary file reads.
