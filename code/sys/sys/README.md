# 🧫 sys
Core system tools ← API module index (ESM/WASM/JSR).

- Module Management
- Common Help

---

Module management:

- upgrade
- backup (snapshots)

```ts
import { Module } from '@sys/sys/module';

// WIP( 🐷 something like):
Module.upgrade({}): Promise<R>
```


Run in Deno:

```bash
deno run -RWE jsr:@sys/sys@<version>/main --cmd=<command> --<params>
```

Or writen in to a `deno.json` task configuration:

```json
{
  "tasks": {
    "cmd": "deno run -RWE jsr:@sys/sys@<version>/main --cmd=<command> --<params>",

    "dev": "...",
    "build": "...",
    "serve": "...",

    "upgrade": "...",
    "backup": "...",
    "clean": "...",
    "help": "..."
  }
}
```