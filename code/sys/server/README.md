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

#### WebSocket Cmd transport

Use `WebSocketServer` to bind typed [`@sys/event/cmd`](https://jsr.io/@sys/event/doc/cmd)
handlers to WebSocket upgrades. `@sys/server` owns upgrade, transport binding, status,
and lifecycle; applications own command grammar and handlers.

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
