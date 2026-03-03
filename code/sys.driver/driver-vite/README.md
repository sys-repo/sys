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
`@sys/driver-vite` splits resolution into two layers:

#### `Policy` (`driver-vite`)
- workspace aliases
- import-map rewrites (for example `@sys/* → jsr:...`)
- Vite config/plugin composition

#### `Transport` (Deno adapter)
- resolve/load of `jsr:`, `npm:`, and URL-like specifiers
- module identity preservation across Vite/Rollup
- relative-import chaining after resolution

#### Contract
- Policy rewrites names.
- Transport resolves and loads modules.
- Transport does not emit cache-hash file paths as final module IDs.
  Those IDs are not portable and can break downstream relative resolution and TS parsing.

#### Why this is explicit
- rewrite succeeds, load fails
- relative imports break from opaque cache IDs
- TS syntax is parsed as plain JS when module identity is lost



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

Within the `vite.config.ts` file in the root of your module folder:

```ts
import { Vite } from '@sys/driver-vite';
import { defineConfig } from 'vite';
import reactPlugin from '@vitejs/plugin-react';

export default defineConfig(() => {
  const workspace = Vite.Plugin.workspace();
  return { plugins: [reactPlugin(), workspace] };
});
```

Optionally, you can filter the workspace modules that are exposed
to the Vite bundle:

```ts
export default defineConfig(() => {
  const workspace = Vite.Plugin.workspace({ filter: (e) => e.subpath.startsWith('/client') });
  return { plugins: [reactPlugin(), workspace] };
});
```

Along with the option to manulate the configuration further after the initial
baseline settings have initialized, using the `mutate` plugin callback.

```ts
export default defineConfig(() => {
  const workspace = Vite.Plugin.workspace({
    mutate(e) {
      console.info(c.dim(`\n👋 (callback inside plugin)`));
      if (e.ws) console.info(e.ws.toString({ pad: true }));
    },
  });
  return { plugins: [reactPlugin(), workspace] };
});
```

See [basic](./vite.config.-sample.simple.ts) and [custom](./vite.config.-sample.custom.ts) `vite.config.ts` sample files.
