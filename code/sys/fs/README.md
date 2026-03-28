# Filesystem
Primary `@sys/fs` file-system tools.

## Overview
`@sys/fs` provides a unified abstraction for working with the file system, environment setup, and directory watching.
It standardizes essential I/O and workspace setup operations across the sys runtime.

### Structure
- `Fs` — Core file and directory operations.
- `Path` — Path utilities.
- `FileMap` — Declarative file-tree representation.
- `JsonFile` — Immutable JSON-on-disk file wrapper with typed load/save helpers.
- `Watch` — Directory watching.
- `Env` — Environment initialization and `.env` loading helpers.


```ts
import { Fs, Path, Env } from '@sys/fs';
import { FileMap } from '@sys/fs/filemap';
import { Watch } from '@sys/fs/watch';
```

<p>&nbsp;</p>

## Env
`Env.load()` reads `.env` values and falls back to the live process environment for keys not provided by `.env` file(s).

- `Env.load({ search: 'cwd' })` reads only the `.env` in the target directory.
- `Env.load({ search: 'upward' })` merges every ancestor `.env` from root to the target directory, with closest values winning and farther ancestors filling missing keys.

```ts
import { Env } from '@sys/fs/env';

const env = await Env.load({ search: 'upward' });
env.get('API_KEY');
```


<p>&nbsp;</p>


## JsonFile
A minimal, immutable JSON-on-disk primitive that gives you a typed `ImmutableRef<T>` backed by a file, with automatic `.meta.createdAt/.modifiedAt` management and an ergonomic `fs.save()` for persistence.

Json files can be `.json` or `.jsonc` (comments + trailing commas). JSONC is parsed via `Fs.readJson` by file extension.

```ts
import type * as t from '@sys/fs/t';
import { JsonFile } from '@sys/fs/file';

type Doc = t.JsonFileDoc & { msg?: string; count: number };
const initial = JsonFile.default<Doc>({ count: 123 });
//       ↑
//       ↑ { '.meta': { createdAt: 0 }, count: 123 }


// Load a JSON file (in-memory until explicitly saved):
const file = await JsonFile.get('./config.json', initial);


// Read + modify through common ImmutableRef<T> interface:
console.info(file.current.count);  // → 123
file.change((d) => d.count++);


// Persist changes to disk.
await file.fs.save();
```

<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>

---
### Programming Environment Bootstrap
From a clean folder with, say, a `main.ts` entry point:

```bash
deno run -RW main.ts
```

Because the file system is often the first surface a new script touches, `@sys/fs` provides
a convenience helper to detect when it’s running inside VSCode and automatically insert
default workspace settings.

```ts
// main.ts
import { Fs, Env } from 'jsr:@sys/fs';

await Env.init();
```

This bootstraps a Deno-based development environment from scratch —
creating a clean, ready-to-work setup with sensible defaults.
