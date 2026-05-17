# Server

System primitives and entrypoint surfaces for server packages.

## Usage

Read the package DSL before using, changing, or composing server primitives:

```sh
deno run -ER jsr:@sys/server --help
deno run -ER jsr:@sys/server dsl
deno run -ER jsr:@sys/server dsl websocket
deno run -ER jsr:@sys/server dsl websocket.cmd --format skill
```

Use the WebSocket command server primitive from its public runtime path:

```ts
import { WebSocketServer } from 'jsr:@sys/server/websocket';
```
