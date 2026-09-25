# @sys/driver-vite

Vite tooling for Deno workspaces: task entrypoints, application configuration, and transport for
Deno-style module imports. The driver adapts Vite's Node/npm-oriented toolchain without replacing
Vite's application model.

## Usage

Start from a configured Deno project with a compatible `vite` dependency in its nearest
`package.json`; the published driver selects Vite from that consumer declaration. With an HTML entry
at `src/index.html`, put this local shim at `-scripts/task.vite.ts`:

```ts
import 'jsr:@sys/driver-vite/main';
```

`/main` executes immediately; it is a task entrypoint, not a passive library import. Add these tasks
to the project's `deno.json`:

```json
{
  "tasks": {
    "dev": "deno run -A ./-scripts/task.vite.ts --cmd=dev --in=./src/index.html",
    "build": "deno run -A ./-scripts/task.vite.ts --cmd=build --in=./src/index.html"
  }
}
```

These commands grant full authority to the parent launcher; the Vite child has separate grants
below. In an existing `@sys/tmpl` workspace, reuse its tasks and dependency configuration. Bare
imports need configured resolution, and tasks using `-P=dev` need a consumer-defined permission
preset; an imported package does not supply one.

Place `vite.config.ts` at the project root:

```ts
import { Vite } from 'jsr:@sys/driver-vite';

export default Vite.Config.define(() => {
  const paths = Vite.Config.paths({
    app: { entry: './src/index.html', outDir: 'dist' },
  });
  return Vite.Config.app({ paths });
});
```

Run `deno task dev` for development or `deno task build` for ESM output. The HTML entry, its
application modules, and their dependencies must exist. Build output replaces the configured output
directory's contents; do not use it for unrelated files.

`Vite.Config.app` assembles workspace aliases, import-map handling, React/WASM defaults, and output
layout. Use `vitePlugins` to add your plugins after the common set and before the driver's final
plugins, or compose a broader config through `Vite.Config.define`. See the
[configuration API](https://jsr.io/@sys/driver-vite/doc/config) for paths, workspace filtering,
chunking, and plugin options.

## Resolution and authority

Policy rewrites workspace/import-map names; transport resolves and loads `jsr:`, `npm:`, and URL
specifiers. Module identity must remain stable and portable so relative imports chain correctly, not
become cache-hash paths. Bundled output is ESM only.

The child `deno run npm:vite` process does not use `-A`:

- Build writes are scoped to output and cache roots, with config-cache access where required by the
  Vite loader. Dev additionally permits writes beneath the consumer project root. Canonical paths
  are included where needed.
- Build network access is limited to `localhost`; dev permits local serving/startup addresses.
  System access is limited to runtime queries, with `networkInterfaces` added for dev.
- Run access is scoped to the active Deno executable. FFI access covers the `node_modules/.deno`
  tree beside the nearest `package.json`, not just individual native packages.
- Read and environment access remain broad, including Vite's `process.env` enumeration.

These are Deno API grants, not native subprocess or FFI confinement. Use trusted application code,
configuration, and plugins.

## Verification

From this package, `deno task test` runs local driver, entrypoint, and candidate-consumer checks.
`deno task smoke` is the separate guarded published-consumer lane, with JSR metadata preflight and
fixture preparation. Local checks do not establish published-package behavior.

See the [API documentation](https://jsr.io/@sys/driver-vite/doc) for programmatic entry, service,
and plugin surfaces, and [JSR's Vite guide](https://jsr.io/docs/with/vite) for registry integration.
