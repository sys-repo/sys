# main (entry)
CLI entry point to the core system tools ← API module index (ESM/WASM/JSR).

- Module Management
- Common Help

---

Module management:

- upgrade
- backup (snapshots)

```ts
import { Cmd } from '@sys/main';

// WIP( 🐷 something like):
Cmd.main([]): Promise<R>
```


Run in Deno:

```bash
deno run -RWE jsr:@sys/main@<version> <command> --<params>
```

---

Or writen in to a `deno.json` task configuration:

```json
{
  "tasks": {
    "sys": "deno run -RWE jsr:@sys/main@<version> <command> --<params>",

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

Via the `deno task` interface, prior to [compiling an installable binary](https://docs.deno.com/runtime/reference/cli/compile/).

```bash
deno task sys upgrade
deno task sys --help
```
