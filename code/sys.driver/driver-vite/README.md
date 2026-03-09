# Vite Driver

Tools for working with [Vite](https://vitejs.dev/) as an ESM bundler and design-time development harness
within a multi-module [Deno](https://docs.deno.com/) workspace.


#### Philosophy

<UI Framework™️> agnostic.


#### Standards
Bundled output from `@sys/driver-vite` is **ESM only** to conform with the [JSR package rules](https://jsr.io/docs/publishing-packages#jsr-package-rules)...not to mention it is the [actual standard](https://tc39.es/ecma262/#sec-modules) and has been for a decade.
It's time. Good things happen collectively when everything conforms to the same single common/open ideas. ("[Standards Make the World](https://summerofprotocols.com/research/standards-make-the-world)")


>> "Fully standardized and finalized as a core part of ECMAScript, maintained by TC39 and ECMA International" (2015)
[-ref](https://tc39.es/ecma262/#sec-modules)


<p>&nbsp;</p>

## Resolution Model
`@sys/driver-vite` separates import handling into two layers so each layer has one job.

#### `Policy` (`driver-vite`)
- rewrites workspace aliases and import-map names (for example `@sys/* → jsr:...`)
- composes the Vite config/plugin layer

#### `Transport` (Deno adapter)
- resolves and loads `jsr:`, `npm:`, and URL-like specifiers
- preserves module identity across Vite/Rollup so relative imports continue to chain correctly

#### Contract
- `Policy` rewrites names.
- `Transport` resolves and loads modules.
- Final module IDs must be stable and portable (never cache-hash paths).

#### Validation
- `deno task test` is the default local source-of-truth lane.
- `deno task test:external` is the external-consumer lane. Run it post-release against published JSR packages.

#### Security Posture
`@sys/driver-vite` intentionally constrains the child `deno run npm:vite ...` process instead of
defaulting to broad toolchain permissions.

Current posture:
- no child `-A`
- `run` is scoped to the resolved native `esbuild` binary and the active `deno` executable only
- `write` is scoped to the executing project `cwd` plus the shared Vite cache under `node_modules/.vite`
- `build` runs without child network permission
- `dev` network is limited to `localhost`, `127.0.0.1`, and `0.0.0.0`
- `dev` system access is limited to `networkInterfaces`

Current limit:
- child `env` remains broad because Vite 7 enumerates `process.env` in its Node config path; this prevents a stable name-scoped env allow-list in Deno today

Validation lanes:
- `src/m.vite/-test/-wrangle.test.ts` locks the permission-shaping contract
- `src/m.vite/-test/-build.test.ts` and `src/m.vite/-test/-dev.test.ts` validate local runtime behavior
- `deno task test:external` validates published/external consumer behavior


<p>&nbsp;</p>
<p>&nbsp;</p>


---

### References

- [JSR Docs: Vite](https://jsr.io/docs/with/vite) (Build Tool).
- [Deno Docs: Workspace](https://docs.deno.com/runtime/fundamentals/workspaces/).
- [jsr:@sys/driver-deno](https://jsr.io/@sys/driver-deno) ← for workspace import/dependency graph.


<p>&nbsp;<p>

---

### Runtime ← Bundler

![deno-vite-v8-isolate-w3c-typescript-esm-logos](https://github.com/user-attachments/assets/f76ef3f2-f4f3-40bf-9301-517e21fe5a0d)


<p>&nbsp;</p>

# Usage
In your project (with a `deno.json`) declare entry point via `deno tasks` which point in
to the common set of API "commands" (aka. "tasks") via the `/main` entry-point, eg:

```bash
jsr:@sys/driver-vite@<version>/main --cmd=dev
jsr:@sys/driver-vite@<version>/main --cmd=build
jsr:@sys/driver-vite@<version>/main --cmd=serve

# (etc)...
```

Call up "Help" to see available commands → `deno task help`:

```bash
Usage: deno task [COMMAND]

  deno task dev       Run the development server.
  deno task build     Transpile to production bundle.
  deno task serve     Run a local HTTP server over the production bundle.
  deno task clean     Delete temporary files.
  deno task help      Show help.
```


<p>&nbsp;<p>




## Configuration

Define explicit app paths, then hand the rest of the baseline config assembly to
`Vite.Config.app(...)`.

```ts
import { Vite } from 'jsr:@sys/driver-vite';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const paths = Vite.Config.paths({
    app: {
      entry: 'src/-test/index.html',
      outDir: 'dist',
    },
  });

  return Vite.Config.app({ paths });
});
```

`Vite.Config.app(...)` composes the default application bundle shape:
- workspace-aware aliasing
- import-map and Deno transport handling
- React / WASM plugin defaults
- production bundle output layout

You can still constrain workspace visibility and customize bundle behavior:

```ts
import { Vite } from 'jsr:@sys/driver-vite';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
  const paths = Vite.Config.paths({
    app: {
      entry: 'src/-test/index.html',
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
  });
});
```

For direct examples, see:
- [`src/-test/vite.sample-config/simple/vite.config.ts`](./src/-test/vite.sample-config/simple/vite.config.ts)
- [`src/-test/vite.sample-config/custom/vite.config.ts`](./src/-test/vite.sample-config/custom/vite.config.ts)


<p>&nbsp;</p>

## Tasks

- `deno task test` → local driver and local bridge integration
- `deno task test:external` → external-consumer smoke for the pinned published package lane
- `deno task check` → module typecheck
- `deno task prep` → sync publish-sensitive fixture pins and transport loader imports
- `deno task clean` → remove generated temp state and sample fixture build artifacts
