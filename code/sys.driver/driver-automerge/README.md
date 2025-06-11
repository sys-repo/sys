# Automerge (CRDT)
An `Immutable<T>` implementation using [Automerge](https://automerge.org/) as the [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) data-structure.

- https://automerge.org
- https://github.com/automerge (MIT)




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
    'BroadcastChannel',
    { wss: 'localhost:8080' },       // or:↓
    { wss: 'sync.automerge.org' },   // sample sync-server, see: `@sys/driver-automerge/wss` to stand-up an server.
  ],
});


```


### WebSocket Sync Server
Start sample on `localhost:8080` (local-dev):

```bash
deno task ws
```
```ts
import { CrdtServer } from '@sys/driver-automerge/wss';

CrdtServer.start({
  port: 8080,
  dir: '.tmp/wss.crdt',
});
```

