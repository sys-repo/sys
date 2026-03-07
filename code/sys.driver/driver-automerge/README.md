# Automerge (CRDT)

An `Immutable<T>` implementation using [Automerge](https://automerge.org/) as the [CRDT](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) data-structure.

- [automerge.org](https://automerge.org)
- [github.com/automerge](https://github.com/automerge) (MIT)


<p>&nbsp;</p>


### Types
```ts
import { Crdt } from 'jsr:@sys/driver-automerge/t';
//       ↑
//       Crdt.Ref
//       Crdt.Repo
```

<p>&nbsp;</p>

### Environment: FileSystem
Programatically import into a runtime environment that has a file-system:


```ts
import { Crdt } from 'jsr:@sys/driver-automerge/fs';

type T = { count: number };
const repo = Crdt.repo('path/to/dir');
const doc = repo.create<T>({ count: 0 });

doc.change((d) => (d.count = 1234)); // ← Immutable<T>
console.info(doc.current);           // ← { count:1234 }
```

<p>&nbsp;</p>


### Environment: Web Browser
Start UI dev-harness:
```bash
deno task dev
```

Programatically import into browser:

```ts
import { Crdt } from '@sys/driver-automerge/web';

const repo = Crdt.repo({
  storage: 'IndexedDb',
  network: [
    { ws: 'localhost:3030' },       // or:↓
    { ws: 'sync.automerge.org' },   // sample sync-server, see: `@sys/driver-automerge/ws` to stand-up dedicated server.
  ],
});
```

<p>&nbsp;</p>


## Worker
Run the CRDT repository inside a background web-worker, keeping the main (UI) thread free while all heavy operations — merging, patch application, change replay, and network syncing — execute off-thread.

```ts
const url = new URL('./-u.worker.ts', import.meta.url)
const worker = new Worker(url, { type: 'module' });

const { repo } = await Crdt.Worker.Client.spawn(worker);
//        ↑
//        type = Crdt.Repo (proxy)
```

<p>&nbsp;</p>

## Sync Server - WebSockets
During development, you can start the local web-socket server on `localhost`:

```bash
deno task ws
```

```ts
import { Server } from '@sys/driver-automerge/ws';

Server.ws({
  port: 3030,
  dir: '.tmp/sync.crdt',
});
```

Or to start directly via the command-line entrypoint:

```bash
deno run jsr:@sys/driver-automerge/ws

# Optional arguments:
deno run jsr:@sys/driver-automerge/ws --port=3030 --dir=.tmp/sync.crdt --host=0.0.0.0
```
