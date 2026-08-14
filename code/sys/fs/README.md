# Filesystem

## Overview

`@sys/fs` exposes:

- `Fs` — File and directory operations.
- `Fs.Capability.Rooted` — Publication and shared or exclusive leases confined beneath one root.
- `Path` — Path utilities.
- `FileMap` — Declarative file-tree representation.
- `JsonFile` — JSON and JSONC files exposed through `ImmutableRef<T>`.
- `Watch` — Directory watching.
- `Env` — Environment-file loading and initialization.

```ts
import { Env, Fs, Path } from '@sys/fs';
import { FileMap } from '@sys/fs/filemap';
import { Watch } from '@sys/fs/watch';
```

## Rooted publication and lifecycle leases

`Fs.Capability.Rooted` confines publication and lease coordination to admitted paths beneath one
canonical directory. It validates each target batch before use. File publication never overwrites an
existing target and permits at most one concurrent winner. Directory publication uses private
staging directories and the same advisory-lock protocol as lifecycle leases. The directory race and
lease guarantees apply only to cooperating processes bound to the same canonical Rooted directory.

Rooted acquires a lease batch in deterministic lock-identity order. Shared leases may coexist; any
incompatible holder yields a `busy` result. Before returning `busy`, Rooted releases every lock
already acquired for that batch. Cancellation, unsupported locking, and other host failures reject
with a typed Rooted error. `until` governs acquisition only. A returned lease remains held until
`release()`, `await using` disposal, or process exit.

Rooted keeps stable, empty lock files in `.sys-rooted/locks`, outside leased targets. It never
removes or replaces them: replacement could let two processes lock different files for the same
target. The files contain no PID or process identity. Releasing the lease or exiting the process
drops the operating-system locks; the files remain.

Use Rooted when cooperating processes may publish the same immutable cache entry or coordinate the
lifecycle of an owned directory. Rooted exposes publication and coordination only; it cannot read,
list, overwrite, or remove existing content.

```ts
import { Fs } from '@sys/fs';

const rooted = await Fs.Capability.Rooted.create({ root: './store' });
const files = await rooted.admit([{ kind: 'file', path: 'assets/app.js' }]);
await rooted.publishFile(files.targets[0], new TextEncoder().encode('export default 123;'));

const owners = await rooted.admit([{ kind: 'directory', path: 'generations/current' }]);
const result = await rooted.acquireLease(owners.targets, { mode: 'shared' });
if (result.kind === 'busy') throw new Error(`Owner is busy: ${result.target.path}`);
await using lease = result.lease;
// The lease remains held until this scope exits.
```

Rooted confines only operations performed through the capability. It does not revoke file-system
permissions held by the caller.

## Env

`Env.load()` reads the selected `.env` files, then consults the live process environment for missing
keys.

- `Env.load({ search: 'cwd' })` reads only the `.env` in the target directory.
- `Env.load({ search: 'upward' })` reads each ancestor `.env`, from the file-system root through the
  target directory. Nearer files override farther files.

```ts
import { Env } from '@sys/fs/env';

const env = await Env.load({ search: 'upward' });
env.get('API_KEY');
```

## JsonFile

`JsonFile` exposes a `.json` or `.jsonc` file through `ImmutableRef<T>`. It maintains
`.meta.createdAt` and `.meta.modifiedAt`; changes remain in memory until `fs.save()` writes them to
disk. Parsing follows the file extension. JSONC input may contain comments and trailing commas.

```ts
import type * as t from '@sys/fs/t';
import { JsonFile } from '@sys/fs/file';

type Doc = t.JsonFile.Doc & { msg?: string; count: number };
const initial = JsonFile.default<Doc>({ count: 123 });
// { '.meta': { createdAt: 0 }, count: 123 }

// Load without writing:
const file = await JsonFile.get('./config.json', initial);

// Read and update through ImmutableRef<T>:
console.info(file.current.count); // → 123
file.change((d) => d.count++);

// Write pending changes:
await file.fs.save();
```

## Environment initialization

Run a `main.ts` script with file-system read and write permissions:

```bash
deno run -RW main.ts
```

When it detects VS Code, `Env.init()` creates `.vscode/settings.json` with default Deno settings if
the file is absent. It leaves existing settings untouched.

```ts
// main.ts
import { Env } from 'jsr:@sys/fs';

await Env.init();
```
