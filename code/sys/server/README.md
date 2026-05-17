# @sys/server

System primitives and entrypoint surfaces for server packages.

## Usage

Read the package DSL before using, changing, or composing server primitives:

```sh
deno run -ER jsr:@sys/server --help
deno run -ER jsr:@sys/server dsl
deno run -ER jsr:@sys/server dsl websocket
deno run -ER jsr:@sys/server dsl websocket.cmd --format skill
```

#### WebSocket

Start a WebSocket-backed command service from its public runtime path. The returned handle implements [`t.Service.Handle`](https://jsr.io/@sys/types/doc/~/Service.Handle).

```ts
import { WebSocketServer } from 'jsr:@sys/server/websocket';

type Name = 'hello';
type Payload = { hello: { name: string } };
type Result = { hello: { msg: string } };

const server = WebSocketServer.create<Name, Payload, Result>({
  path: '/rpc',
  cmd: {
    handlers: {
      hello: (e) => ({ msg: `Hello, ${e.name}.` }),
    },
  },
});

console.info(`WebSocket command service: ${server.url}`);

// Later, during shutdown:
// await server.close();
```
