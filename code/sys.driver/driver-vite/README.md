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

## Producing a Dist content pin

In a configured workspace with `@sys/driver-vite` mapped, build programmatically and narrow the
result before using its content pin:

```ts
import { Vite } from '@sys/driver-vite';

const result = await Vite.build({
  paths: Vite.Config.paths({ app: { entry: './src/index.html', outDir: 'dist' } }),
  pkg: { name: '@example/app', version: '1.0.0' },
  exitOnError: false,
});
if (!result.ok) throw new Error(result.toString());
console.info(result.pin); // { scheme: 'sys.dist/v2', digest: 'sha256-…' }
```

Success means the required output writes and canonical computation completed, including saving
`dist.json`. `result.pin` identifies payload content; `result.manifestChecksum` identifies the saved
document's exact bytes and is not a content expectation.

When `pkg` is supplied, the build writes `pkg/-pkg.json` into the payload. Those bytes affect the
pin, unlike descriptive package labels at the root of `dist.json`.

Use `exitOnError: false` to receive a failure result rather than the default process exit. Other
errors can still reject the promise. The build's `finally` stops the spinner and awaits command
cleanup during normal return or exception unwinding; `Deno.exit(1)` does not run that cleanup.
Neither failure form promises rollback of build output.

Computation selects an inventory; it does not establish complete-tree verification or independent
trust. See the [shared producer contract](../../sys/fs/README.md#produce-a-content-pin). Distribute
pins through a trusted channel independent of the artifact download. Old manifest-checksum
expectations require explicit rebuilding and recording of canonical content pins, not field
renaming.

## HTML subresource integrity

`Vite.Config.app` adds integrity to owned HTML-linked JS/CSS in production client builds by default.
No plugin import or `true` flag is needed. Unsupported inputs fail the build; integrity is not
silently disabled for compatibility.

**Availability:** this section describes the workspace implementation. Published-driver acceptance
of default-on integrity and dependency-preload coverage remains unverified.

For a deliberate exception, use `plugins: { htmlIntegrity: false }`. Omitted flags retain their
per-field defaults even when other plugin options are supplied. Explicit `true` remains valid.
Development serving is unchanged, and worker plugin factories do not include HTML integrity.
`Vite.Config.define` or native Vite alone does not add the plugin; the default comes from
`Vite.Config.app`, regardless of which runner builds that configuration.

Existing app configs with an explicit integrity factory must remove it or disable the managed
instance. Duplicate resolved instances refuse the build rather than being silently deduplicated.
Advanced caller composition retains one factory with the managed instance disabled:

```ts
import { Vite } from 'jsr:@sys/driver-vite';
import { VitePlugins } from 'jsr:@sys/driver-vite/plugins';

export default Vite.Config.define(() =>
  Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './src/index.html' } }),
    plugins: { htmlIntegrity: false },
    vitePlugins: [VitePlugins.HtmlIntegrity.plugin()],
  })
);
```

### Ownership and coverage

The plugin handles output-owned URLs using Vite's resolved base, including CLI overrides:

- Relative (`./` or empty): resolve from each emitted HTML file's directory.
- Root-relative: require the resolved path to fall within the base directory boundary.
- Absolute HTTP(S) CDN: require both the matching origin and base directory boundary.

Absolute resource URLs are external unless an absolute CDN base establishes ownership. Unrelated
external references remain unchanged and receive no integrity guarantee from this plugin.

For owned URLs, the plugin adds SHA-256 SRI to emitted HTML's module scripts, stylesheets, and
modulepreloads, including dependency-only links. Resource URLs stay unchanged; covered requests use
anonymous CORS, which retains same-origin credentials. Cross-origin hosts must supply suitable CORS
headers; a successful local build does not verify those headers.

Coverage is **not the module graph**. A preload's hash protects its request, not subsequent imports.
Do not rely on preload failure to prevent later execution. CSS imports, workers, images, and fonts
remain outside coverage. Trusted HTML is required. A later tag does not revalidate a module already
loaded through an unprotected path. SRI neither authenticates HTML nor establishes that application
code is safe.

### Build contract

Omit authored `integrity` on plugin-handled source tags; the plugin generates it after bundling.
Keep authored integrity on unrelated external resources. Final tags accept matching integrity;
missing owned outputs, ambiguous paths, and conflicting final metadata fail the build.

This plugin must be the last user `order: 'pre'` HTML hook in Vite's resolved plugin order; a later
pre HTML hook causes build refusal. Earlier input transforms remain supported.

All JS/CSS/HTML transformations must finish **before** this plugin's post-ordered `generateBundle`
hook. Later bundle hooks, disk writers, and post-build rewriting are unsupported; the plugin does
not detect arbitrary later changes. `dist.json` is computed afterward, but is not an SRI validator.

#### Source validation

Local source paths are checked against Vite's root, not the deployment base. Validation also follows
what Vite consumes: `template`/`noscript` content, foreign and inline module scripts, CSS links
regardless of `rel`, and resolver-backed identifiers such as `virtual:entry`. Retained unrelated
external references keep their authored metadata. These input checks do not expand output coverage:
ordinary inert final content stays untouched.

#### Unsupported inputs

`use-credentials` on covered resources, `<base href>`, custom `renderBuiltUrl`, SSR/library builds,
and owned `public/` JS/CSS outside the bundle inventory are unsupported.

The following also fail the build:

- Static `<select>` elements in active output HTML, including option-only selects. The parser can
  discard resource tags that Chromium retains and loads. This restriction does not apply to ordinary
  inert templates or DOM created later by application code.
- Any HTML `<template shadowrootmode>` reached in active output traversal, regardless of mode value
  or host eligibility. Open, closed, and nested declarative roots can load stylesheets; they are not
  ordinary inert templates. Syntax inside an ordinary inert template or raw text stays untouched,
  not covered.
- Resolved `%NAME%` substitutions in HTML (from environment or `define`) and
  `html.additionalAssetSources`. They can change what Vite consumes after input validation or
  outside the built-in attribute vocabulary.

### Integrity checks

From this package, `deno task test:integrity` checks written bytes, build refusals, and browser
behavior on two origins. Its real dependency build tests ordinary static imports under both normal
timing and completed-preload-before-import timing, each with original, tampered, and matching-rehash
controls. Tampered dependency execution fails the test even if the browser reports an integrity
error. Results apply to the recorded browser and loading conditions, not all browsers or timings.

Other controls cover entry/style tampering, preload and HTTP-cache behavior, select parser parity,
and open/closed/nested declarative shadow roots. Build checks cover resolver-backed input
consumption, metadata refusals, and retained external resources. Browser tamper checks require
resource-specific integrity diagnostics; matching rehashed bytes must load. Reports record the
browser user agent and Vite/Rolldown versions.

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

Run from this package. Choose the task for the boundary being changed:

| Command                        | Coverage                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `deno task test`               | Unit contracts, formatters, command construction, local transforms, and cleanup. Excludes real-build/process proofs. |
| `deno task test:proofs`        | Real builds, child startup/configuration, module graphs, loaders, and live dev lifecycles.                           |
| `deno task test:integrity`     | Written-byte checks, build refusals, and [browser integrity controls](#integrity-checks).                            |
| `deno task test:dist:pipeline` | Content-pin stability, projection/materialization, pinned serving, and SRI byte matching—not browser enforcement.    |
| `deno task test:external`      | External-consumer, generated-project, and runtime/browser regression scenarios.                                      |
| `deno task smoke`              | JSR version preflight, fixture preparation, then `test:external` for published-consumer checks.                      |

[deno.json](./deno.json) defines task composition and focused sub-tasks. Linux CI runs `test:proofs`
separately; package `ci` includes it and `test:external`. The Dist pipeline task is separate from
both routine tests and `test:proofs`; run it for changes to the distribution contract.

A green unit run is not a green proof aggregate or full CI run. Parent test invocations use frozen,
cache-only resolution without prompts; those flags do not constrain every loader or child. Local
checks do not establish published-package behavior.

See the [API documentation](https://jsr.io/@sys/driver-vite/doc) for programmatic entry, service,
and plugin surfaces, and [JSR's Vite guide](https://jsr.io/docs/with/vite) for registry integration.
