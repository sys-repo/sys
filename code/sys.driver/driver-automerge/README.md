# Automerge (CRDT)

An `Immutable<T>` implementation using [Automerge](https://automerge.org/) as the [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) data-structure.

- [automerge.org](https://automerge.org)
- [github.com/automerge](https://github.com/automerge) (MIT)




### FileSytem Environment

```ts
import { Crdt } from 'jsr:@sys/driver-automerge/fs';

type T = { count: number };
const repo = Crdt.repo('path/to/dir');
const doc = repo.create<T>({ count: 0 });

doc.change((d) => (d.count = 1234)); // ← Immutable<T>
console.info(doc.current);           // ← { count:1234 }
```



### Browser Environment
Start UI dev-harness:
```bash
deno task dev
```
```ts
import { Crdt } from '@sys/driver-automerge/browser';

const repo = Crdt.repo({
  storage: 'IndexedDb',
  network: [
    { ws: 'localhost:3030' },       // or:↓
    { ws: 'sync.automerge.org' },   // sample sync-server, see: `@sys/driver-automerge/ws` to stand-up dedicated server.
  ],
});


```


### WebSocket Sync Server
During development, you can start the local web-socket server on `localhost`:

```bash
deno task wss
```
```ts
import { Server } from '@sys/driver-automerge/ws';

Server.ws({
  port: 3030,
  dir: '.tmp/sync.crdt',
});
```

