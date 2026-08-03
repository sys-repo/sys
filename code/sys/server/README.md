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

`jsr:@sys/server/dist` turns an externally pinned `dist.json` into an immutable local generation
without choosing product or activation policy:

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
