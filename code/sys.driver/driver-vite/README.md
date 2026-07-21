# @sys/driver-vite

Vite tooling for Deno workspaces.

## What

`@sys/driver-vite` lets a Deno workspace use Vite without inventing a new app model. It keeps the application close to normal Vite usage while owning the Deno-specific adaptation work.

## Why

Vite assumes a Node/npm-oriented runtime, module-resolution, and config-loading environment. Deno has different import, runtime, and compatibility semantics. This driver owns that boundary so application code can stay boring.

## Usage

The current `@sys/tmpl` package shape uses a local task shim:

```ts
// -scripts/task.vite.ts
import '@sys/driver-vite/main';
```

and `deno.json` tasks call that shim:

```json
{
  "tasks": {
    "dev": "deno run -A ./-scripts/task.vite.ts --cmd=dev --in=./src/index.html",
    "build": "deno run -A ./-scripts/task.vite.ts --cmd=build --in=./src/index.html",
    "serve": "deno run -P=dev ./-scripts/task.vite.ts --cmd=serve",
    "info": "deno run -P=dev ./-scripts/task.vite.ts --cmd=info"
  }
}
```

Run `deno task info` to inspect the local task surface:

```text
Usage: deno task [COMMAND]

  deno task dev    Run the development server.
  deno task build  Transpile to production bundle.
  deno task serve  Serve build on HTTP server.

  deno task clean  Delete temporary files.
  deno task info   Show info.
```

## Configuration

Define explicit app paths, then hand the rest of the baseline config assembly to `Vite.Config.app(...)`.
The current `@sys/tmpl` package config starts with this shape:

```ts
import { Vite } from '@sys/driver-vite';

export default Vite.Config.define(() => {
  const entry = './src/index.html';
  const sw = './src/-test/-sw.ts';
  const paths = Vite.Config.paths({ app: { entry, sw } });
  return Vite.Config.app({
    paths,
    visualizer: false,
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', '@sys/std');
      e.chunk('css', '@sys/ui-css');
    },
  });
});
```

`Vite.Config.app(...)` composes the default application bundle shape:
- workspace-aware aliasing
- import-map and Deno transport handling
- React / WASM plugin defaults
- production bundle output layout

It also preserves two explicit extension paths:
- `vitePlugins` for caller-supplied Vite plugins appended after the driver/common plugin set
- normal outer `Vite.Config.define(...)` composition for broader raw Vite config shaping

You can still constrain workspace visibility and customize bundle behavior:

```ts
import { Vite } from 'jsr:@sys/driver-vite';

export default Vite.Config.define(async () => {
  const paths = Vite.Config.paths({
    app: {
      entry: 'src/index.html',
      outDir: 'dist',
    },
  });

  return Vite.Config.app({
    paths,
    filter(e) {
      if (e.subpath.startsWith('/client')) return true;
      if (e.pkg === '@sys/std') return true;
      return false;
    },
    chunks(e) {
      e.chunk('react', 'react');
      e.chunk('react.dom', 'react-dom');
      e.chunk('sys', ['@sys/std']);
    },
    minify: true,
    plugins: { react: true, wasm: true, deno: true },
    vitePlugins: [
      {
        name: 'custom:example',
      },
    ],
  });
});
```

Examples:
- [`src/-test/vite.sample-config/simple/vite.config.ts`](./src/-test/vite.sample-config/simple/vite.config.ts)
- [`src/-test/vite.sample-config/custom/vite.config.ts`](./src/-test/vite.sample-config/custom/vite.config.ts)

## Resolution model

`@sys/driver-vite` separates import handling into two layers.

### Policy

- rewrites workspace aliases and import-map names, for example `@sys/* → jsr:...`
- composes the Vite config/plugin layer

### Transport

- resolves and loads `jsr:`, `npm:`, and URL-like specifiers
- preserves module identity across Vite/Rollup so relative imports continue to chain correctly

### Contract

- Policy rewrites names.
- Transport resolves and loads modules.
- Final module IDs must be stable and portable, never cache-hash paths.

Bundled output is ESM only.

## Child process permissions

`@sys/driver-vite` constrains the child `deno run npm:vite ...` process instead of defaulting to broad toolchain permissions.

Current posture:
- no child `-A`
- `run` is scoped to the active `deno` executable only
- `write` is scoped to the executing project root and shared Vite cache roots, including canonical filesystem paths where required
- `build` network is limited to local Vite/Deno startup addresses
- `dev` network is limited to local Vite/Deno startup addresses
- `build` system access is limited to `osRelease`, `homedir`, `uid`, and `gid`
- `dev` system access is limited to `osRelease`, `homedir`, `uid`, `gid`, and `networkInterfaces`

Current limit:
- child `env` remains broad because Vite's Node-compatible config path enumerates `process.env`; this prevents a stable name-scoped env allow-list in Deno today

Validation lanes:
- `src/m.vite/-test/-wrangle.test.ts` locks the permission-shaping contract
- `src/m.vite/-test/-build.test.ts` and `src/m.vite/-test/-dev.test.ts` validate local runtime behavior
- `deno task smoke` validates published/external consumer behavior with JSR metadata preflight and fixture prep
- `deno task test:external` runs the raw published/external suite directly

## Tasks

- `deno task test` → local driver and local bridge integration
- `deno task smoke` → guarded external-consumer smoke for the pinned published package lane
- `deno task test:external` → raw external-consumer suite
- `deno task check` → module typecheck
- `deno task prep` → sync publish-sensitive fixture pins and transport loader imports
- `deno task clean` → remove generated temp state and sample fixture build artifacts

## Debugging

### Perf

`SYS_DRIVER_VITE_PERF` supports leveled transport/startup diagnostics from both the parent and child Vite processes.

- `SYS_DRIVER_VITE_PERF=1` → calm operator summaries and major readiness milestones
- `SYS_DRIVER_VITE_PERF=2` → diagnostic mode: phase timings, slow resolve samples, cache misses/writes/hits
- `SYS_DRIVER_VITE_PERF=3` → full trace mode, including per-item inflight/settled chatter

```bash
SYS_DRIVER_VITE_PERF=1 deno task dev
SYS_DRIVER_VITE_PERF=2 deno task dev
SYS_DRIVER_VITE_PERF=3 deno task dev
```

### Resolve trace

`SYS_DRIVER_VITE_TRACE_RESOLVE=1` enables narrow resolve-provenance tracing for short-lived transport audit/debug work.

```bash
SYS_DRIVER_VITE_TRACE_RESOLVE=1 deno task dev
```

Current trace output focuses on:
- resolve request keys and canonical aliases
- miss / inflight-hit / settled-hit / alias-hit boundaries
- importer-derived dependency hits
- resolved redirect / alias identity hints

## References

- [JSR Docs: Vite](https://jsr.io/docs/with/vite)
- [Deno Docs: Workspace](https://docs.deno.com/runtime/fundamentals/workspaces/)
- [jsr:@sys/driver-deno](https://jsr.io/@sys/driver-deno)
