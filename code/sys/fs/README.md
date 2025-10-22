# @sys/fs
File system utilities.

## Overview
`@sys/fs` provides a unified abstraction for working with the file system, environment setup, and directory watching.
It standardizes essential I/O and workspace setup operations across the sys runtime.

### Structure
- `Fs` — Core file and directory operations.
- `Path` — Path utilities.
- `FileMap` — Declarative file-tree representation.
- `Watch` — Directory watching.
- `Env` — Environment initialization helpers.


```ts
import { Fs, Path, Env } from '@sys/fs';
import { FileMap } from '@sys/fs/filemap';
import { Watch } from '@sys/fs/watch';
```

<p>&nbsp;</p>

---
### (Convenience) - Bootstrap Environment
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
