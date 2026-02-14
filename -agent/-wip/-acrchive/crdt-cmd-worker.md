# Plan: Create m.Cmd.worker

Replace `m.worker`'s hand-rolled wire protocol with the generic `Cmd` system.

## Design Decisions

- **Pure Cmd streaming** for ALL events (no hybrid)
- **Single handshake** (config in `crdt:attach` message)
- **WebSocket publishing** → Phase 6: `m.Cmd.ws`

---

## Architecture

```
m.Cmd.worker    ← NEW: Cmd-based worker transport
m.Cmd           ← existing: imports from m.Cmd.worker
m.Cmd.commands  ← existing: unchanged
```

---

## File Structure (Final - 7 files)

```
m.Cmd.worker/
  mod.ts              ← entry point
  common.ts           ← imports
  t.ts                ← ALL types (commands, events, lib surface)
  m.Cmd.worker.ts     ← main module + make()
  u.Host.ts           ← attach() + listen() + handlers inline
  u.Client.ts         ← repo() + spawn()
  u.Doc.ts            ← doc proxy (adapted from m.worker)
  -test/
    -.test.ts
```

**What was eliminated:**
- `t.cmd.ts`, `t.event.ts`, `t.lib.ts` → merged into `t.ts`
- `u.make.ts` → inlined into `m.Cmd.worker.ts`
- `u.host.attach.ts`, `u.host.listen.ts`, `u.host.handlers.ts` → merged into `u.Host.ts`
- `u.client.repo.ts`, `u.client.spawn.ts` → merged into `u.Client.ts`
- `u.client.stall.ts` → eliminated (stall = no events on stream)

---

## Command Surface

```typescript
type WorkerCmdName =
  | 'repo:subscribe'    // STREAM: repo-level events (props, network)
  | 'repo:create'       // UNARY:  create doc → { id }
  | 'repo:get'          // STREAM: get doc + doc events
  | 'repo:delete'       // UNARY:  delete doc
  | 'repo:sync.enable'; // UNARY:  toggle sync

type WorkerCmdPayload = {
  'repo:subscribe': {};
  'repo:create': { initial: unknown };
  'repo:get': { id: t.StringId; options?: t.CrdtRepoGetOptions };
  'repo:delete': { id: t.StringId };
  'repo:sync.enable': { enabled?: boolean };
};

type WorkerCmdResult = {
  'repo:subscribe': void;                    // stream never "completes" normally
  'repo:create': { id: t.StringId };
  'repo:get': { id: t.StringId } | { error: t.CrdtRepoError };
  'repo:delete': void;
  'repo:sync.enable': { enabled: boolean };
};

type WorkerCmdEvent = {
  'repo:subscribe': t.CrdtRepoEvent;         // props/change, network/*
  'repo:get': t.CrdtDocEvent;                // doc/snapshot, doc/change, doc/deleted
  // others don't stream events
};
```

**Note:** No `repo:ready` command. Opening `repo:subscribe` stream IS the ready signal.

---

## Handshake (Single Step)

**Old (two handshakes):**
```
spawn: wait workerReady → post crdt:attach → cmd.send('attach', {config})
```

**New (one handshake):**
```
spawn: wait workerReady → post crdt:attach + config
listen: receive crdt:attach → create repo → attach directly
```

The `attach` Cmd command is eliminated.

---

## Phase 1: Types

Create `m.Cmd.worker/t.ts`:

```typescript
// Command names, payloads, results, events (as above)

// Factory type
type WorkerCmdFactory = t.CmdFactory<
  WorkerCmdName,
  WorkerCmdPayload,
  WorkerCmdResult,
  WorkerCmdEvent
>;

// Library surface
type CrdtWorkerCmdLib = {
  make(): WorkerCmdFactory;
  Client: {
    repo(port: MessagePort, opts?: WorkerClientOpts): t.CrdtRepoWorkerProxy;
    spawn(url: URL | Worker, opts?: WorkerSpawnOpts): Promise<WorkerSpawnResult>;
  };
  Host: {
    attach(port: MessagePort, repo: t.CrdtRepo): t.CmdHost;
    listen(self: typeof globalThis, repo: t.CrdtRepo | t.CrdtRepoFactory): void;
  };
};
```

---

## Phase 2: Host (`u.Host.ts`)

```typescript
export function attach(port: MessagePort, repo: t.CrdtRepo): t.CmdHost {
  const cmd = make();
  return cmd.host(port, {
    // Streaming: repo events
    'repo:subscribe': async function* () {
      for await (const event of repo.events().$) {
        yield event;  // Cmd streaming sends as CmdEventEnvelope
      }
    },

    // Unary: create doc
    'repo:create': async ({ initial }) => {
      const res = await repo.create(initial);
      if (!res.ok) throw new Error(res.error?.message);
      return { id: res.doc.id };
    },

    // Streaming: get doc + events
    'repo:get': async function* ({ id, options }) {
      const res = await repo.get(id, options);
      if (!res.ok) throw new Error(res.error?.message);
      yield { id: res.doc.id };  // Initial result
      for await (const event of res.doc.events().$) {
        yield event;  // Doc changes
      }
    },

    // Unary: delete
    'repo:delete': async ({ id }) => {
      await repo.delete(id);
    },

    // Unary: sync
    'repo:sync.enable': ({ enabled }) => {
      repo.sync.enable(enabled);
      return { enabled: repo.sync.enabled };
    },
  });
}

export function listen(self: typeof globalThis, input: t.CrdtRepo | t.CrdtRepoFactory) {
  self.addEventListener('message', async (ev) => {
    if (ev.data?.kind !== 'crdt:attach') return;
    const port = ev.ports?.[0] ?? ev.data.port;
    const config = ev.data.config;

    const repo = typeof input === 'function'
      ? await input({ config })
      : input;

    attach(port, repo);
  });

  self.postMessage({ kind: 'crdt:worker:ready' });
}
```

---

## Phase 3: Client (`u.Client.ts`)

```typescript
export function repo(port: MessagePort, opts?: WorkerClientOpts): t.CrdtRepoWorkerProxy {
  const cmd = make();
  const client = cmd.client(port, { timeout: opts?.timeout });

  // Open repo subscription immediately
  const repoStream = client.stream('repo:subscribe', {});
  const event$ = new Subject<t.CrdtRepoEvent>();
  repoStream.onEvent((e) => event$.next(e));

  // ... rest of proxy implementation using client.send() / client.stream()
}

export async function spawn(input: URL | Worker, opts?: WorkerSpawnOpts) {
  const worker = input instanceof Worker ? input : new Worker(input, { type: 'module' });
  const { port1, port2 } = new MessageChannel();

  // Wait for worker ready
  await waitFor(worker, 'crdt:worker:ready');

  // Single handshake: transfer port + config
  worker.postMessage({ kind: 'crdt:attach', config: opts?.config, port: port2 }, [port2]);

  // Create client proxy
  const proxyRepo = repo(port1, opts);

  return { worker, repo: proxyRepo };
}
```

---

## Phase 4: Doc Proxy (`u.Doc.ts`)

Adapt logic from `m.worker/u.client.proxy.doc.ts` and `u.client.proxy.doc.change.ts`:

- **Keep:** Domain logic (state mirroring, change patching, path filtering)
- **Remove:** Raw message handling (replaced by Cmd stream)
- **Simplify:** Use `stream.onEvent()` instead of manual `addEventListener`

```typescript
export function createDocProxy<T>(id: t.StringId, stream: t.CmdStream): t.CrdtDocWorkerProxy<T> {
  // stream.onEvent() receives doc/snapshot, doc/change, doc/deleted
  // ... adapt existing proxy logic
}
```

---

## Phase 5: Migration

1. Create `m.Cmd.worker` (parallel to `m.worker`)
2. Update `m.Cmd` to import from `m.Cmd.worker`
3. Update consumers to use new spawn
4. Delete `m.worker`

---

## Verification

```bash
cd /code/sys.driver/driver-automerge
deno task check   # types
deno task test    # tests
```

Integration test:
```typescript
const { port1, port2 } = new MessageChannel();
const realRepo = await Crdt.repo().whenReady();
CrdtWorkerCmd.Host.attach(port2, realRepo);

const proxy = CrdtWorkerCmd.Client.repo(port1);
// proxy.events().$ receives events via Cmd streaming

const { doc } = await proxy.create({ count: 0 });
// returns when repo:create completes

const docStream = proxy.get(doc.id);
// docStream.onEvent() receives doc changes via Cmd streaming
```

---

## Phase 6: Create `m.Cmd.ws`

Move WebSocket publishing to its own module.

### File Structure

```
m.Cmd.ws/
  mod.ts              ← export { CrdtCmdWs }
  common.ts           ← imports
  t.ts                ← types
  m.Cmd.ws.ts         ← main module
  u.serve.ts          ← WebSocket server
```

### Implementation (`u.serve.ts`)

```typescript
export function serve(args: { repo: t.CrdtRepo; port: number; hostname?: string }) {
  const { repo, port, hostname } = args;
  Deno.serve({ port, hostname }, (req) => {
    if (req.headers.get('upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }
    const { socket, response } = Deno.upgradeWebSocket(req);
    const endpoint = Cmd.Transport.fromWebSocket(socket);
    CrdtCmd.attachHost(repo, endpoint);
    return response;
  });
}
```

### Usage (fs worker)

```typescript
// Before:
import { publishCommands } from '../m.worker/u.host.publishCommands.ts';
publishCommands({ repo, port, hostname });

// After:
import { CrdtCmdWs } from '../m.Cmd.ws/mod.ts';
CrdtCmdWs.serve({ repo, port, hostname });
```

### Migration

1. Create `m.Cmd.ws` module
2. Update fs worker factory import
3. Remove `publishCommands` from `m.worker`
