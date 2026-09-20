# @sys/driver-automerge

[Automerge](https://automerge.org/)-backed CRDT repositories and immutable document references. Read
a document through `current`; mutate its draft inside `change`.

Choose an entrypoint for your runtime:

- `/fs`: optional filesystem storage in Deno.
- `/web`: optional IndexedDB storage and browser WebSocket networking.
- `/ws`: WebSocket sync server.
- `/t`: type-only contracts, including `Crdt.Ref` and `Crdt.Repo`.

Storage and networking are optional. Without either, a repository lives in memory and stays local.
Create repositories through `/fs` or `/web`, not the package root.

## Filesystem

In Deno, allow read/write access to the storage directory. `create` and `get` return promises: await
the result and check `ok` before using the document. A call can also reject.

```ts
import { Crdt } from 'jsr:@sys/driver-automerge/fs';

type T = { count: number };
await using repo = Crdt.repo('.tmp/example.crdt');

const result = await repo.create<T>({ count: 0 });
if (!result.ok) throw result.error;
using doc = result.doc;

doc.change((draft) => (draft.count = 1234));
console.info(doc.current.count); // → 1234
```

`using` and `await using` clean up at scope exit, including on error. Here, the document reference
is disposed first, then repository shutdown is awaited.

Disposal releases a reference; it does not delete the stored document. Use `repo.delete` for that.
For longer-lived resources, dispose document and event handles when finished, unsubscribe listeners,
and await `repo.dispose()` at shutdown.

## Browser

Use a browser toolchain that resolves JSR imports and supports `await using`. IndexedDB storage does
not require a sync server:

```ts
import { Crdt } from 'jsr:@sys/driver-automerge/web';

await using repo = Crdt.repo({ storage: { database: 'example-crdt' } });
await repo.whenReady();
console.info(repo.stores);
```

Add `network: [{ ws: 'ws://localhost:3030' }]` to connect to your sync server. Use an endpoint you
control, with `wss://` for remote connections from HTTPS pages.

## Worker ownership

A worker hosts the repository; the main thread uses a proxy. Both `/fs` and `/web` expose
`Crdt.Worker`. The worker must call `Host.listen` before `Client.spawn` can finish. Put this in a
browser worker module named `crdt.worker.ts`:

```ts
import { Crdt } from 'jsr:@sys/driver-automerge/web';

const repo = Crdt.repo(); // In-memory repository owned by this worker.
Crdt.Worker.Host.listen(self, repo);
```

Its separate main-thread module:

```ts
import { Crdt } from 'jsr:@sys/driver-automerge/web';

const worker = new Worker(new URL('./crdt.worker.ts', import.meta.url), { type: 'module' });
try {
  await using repo = (await Crdt.Worker.Client.spawn(worker)).repo;
  await repo.whenReady();
  console.info(repo.status.ready);
} finally {
  worker.terminate();
}
```

The toolchain must build and resolve the worker module. Disposing the proxy closes its port, not the
worker or its repository. The `finally` block terminates the worker separately.

This example keeps data in memory. For persistent storage, arrange for the worker to await
repository disposal before the main thread terminates it. Termination alone does not flush storage.

## Sync server

From this package's source directory, `deno task ws` starts the server with read, write, and network
permissions. It stores data in `.tmp/sync.crdt` and listens on loopback by default. Arrange access
control before exposing it to remote clients.

To manage a server in code, await startup and shutdown. This example prints its address and then
closes it. In an application, keep the scope open for as long as the server should run:

```ts
import { Server } from 'jsr:@sys/driver-automerge/ws';

await using server = await Server.ws({ port: 3030, dir: '.tmp/sync.crdt' });
console.info(server.url); // The port may differ if 3030 is in use.
```

This Deno example requires filesystem and network permissions. The CLI's default port is 3030; the
programmatic API chooses a port when none is supplied.

[API documentation](https://jsr.io/@sys/driver-automerge/doc)
