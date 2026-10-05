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

Use the project setup above, a driver revision that exports `VitePlugins.HtmlIntegrity`, and a
compatible consumer `vite` dependency. Opt in for client HTML builds through the plugin surface:

```ts
import { Vite } from 'jsr:@sys/driver-vite';
import { VitePlugins } from 'jsr:@sys/driver-vite/plugins';

export default Vite.Config.define(() =>
  Vite.Config.app({
    paths: Vite.Config.paths({ app: { entry: './src/index.html' } }),
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

For owned URLs, the plugin adds SHA-256 SRI to emitted HTML's module scripts and stylesheets.
Modulepreloads of the same covered module URL receive matching integrity. Resource URLs stay
unchanged; covered requests use anonymous CORS, which retains same-origin credentials. Cross-origin
hosts must supply suitable CORS headers. Integrity remains opt-in; development is unchanged.

Coverage is **not the module graph**: imported chunks, dependency-only preloads, CSS imports,
workers, images, and fonts remain outside it. Trusted HTML is required. A covered module must not
already be in the document's module map through an unprotected loading path; a later tag does not
revalidate it. SRI neither authenticates HTML nor establishes that application code is safe.

### Build contract

Omit authored `integrity` only on plugin-handled source tags so the plugin can generate it after
bundling; keep authored integrity on unrelated external resources. Local source paths are checked
against Vite's root before bundling, not the deployment base. Input validation includes
`template`/`noscript` content, foreign and inline module scripts, and CSS links consumed by Vite
regardless of `rel`. Consumption is independent of deployment ownership: resolver-backed source
identifiers such as `virtual:entry` are checked too. Unrelated external references that Vite retains
keep their authored metadata. This does not expand browser-active output coverage: ordinary inert
final content stays untouched. Final tags accept matching integrity; missing owned outputs,
ambiguous paths, and conflicting final metadata fail the build.

`use-credentials` on covered resources, `<base href>`, custom `renderBuiltUrl`, SSR/library builds,
and owned `public/` JS/CSS outside the bundle inventory are unsupported.

Additional boundaries fail closed:

- Static `<select>` elements in active output HTML are refused, including ordinary option-only
  selects. The parser can discard resource tags that Chromium retains and loads. Ordinary inert
  templates remain untouched; this restriction does not apply to DOM created later by application
  code.
- Declarative shadow DOM is unsupported. Any HTML `<template shadowrootmode>` reached in active
  output traversal is refused, regardless of the mode value or host eligibility. Open, closed, and
  nested declarative roots can load stylesheets; they are not ordinary inert templates. Syntax
  stored inside an ordinary inert template or raw text stays untouched, not covered.
- Resolved `%NAME%` substitutions in HTML (from environment or `define`) and
  `html.additionalAssetSources` are unsupported. They can change what Vite consumes after input
  validation or outside the built-in attribute vocabulary.

This plugin must be the last user `order: 'pre'` HTML hook in Vite's resolved plugin order; a later
pre HTML hook causes build refusal. Earlier input transforms remain supported.

All JS/CSS/HTML transformations must finish **before** this plugin's post-ordered `generateBundle`
hook. Later bundle hooks, disk writers, and post-build rewriting are unsupported; the plugin does
not detect arbitrary later changes. `dist.json` is computed afterward, but is not an SRI validator.

### Verification

From this package, `deno task test:integrity` checks written bytes and runs the controlled
two-origin Chromium acceptance/tamper matrix, including preload, HTTP-cache, select parser-parity,
and open/closed/nested declarative-shadow controls. Real builds also prove resolver-backed source
consumption, separate metadata refusals, and retained-external controls. A wrong digest must produce
a resource-specific browser integrity diagnostic; matching rehashed bytes must load. The proof
records the browser user agent and actual child Vite/Rolldown versions.

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

From this package, `deno task test` runs the complete retained `test:unit` base lane: contracts,
formatters, command construction, local transforms and cleanup. Thirteen named files that execute
real builds, child configuration/graphs or live dev lifecycles are excluded only from that lane; all
their assertions remain selectable through proof tasks. Parent test invocations use frozen,
cache-only resolution without prompts; those flags do not constrain every loader or child.

`deno task test:proofs` runs the formerly implicit real coverage through `test:entry:process`,
`test:candidate`, `test:build`, `test:bridge`, `test:dev`, `test:config:process`, `test:graph`,
`test:loader` and `test:integrity:build`. Linux CI runs it as a separate Vite-only step; module `ci`
also includes it. A green routine `test` is not a green proof aggregate, full CI or build workflow.
The existing `test:integrity` and `test:external` tasks remain separately selectable.

The explicit `deno task test:dist:pipeline` lane checks stable content pins despite changed
documents, projection/materialization, pinned serving and SRI byte matching—not browser enforcement.
It is outside routine `test` and the former-coverage proof aggregate, but remains required by the
Dist plan. `deno task smoke` is the separate guarded published-consumer lane, with JSR metadata
preflight and fixture preparation. Local checks do not establish published-package behavior.

See the [API documentation](https://jsr.io/@sys/driver-vite/doc) for programmatic entry, service,
and plugin surfaces, and [JSR's Vite guide](https://jsr.io/docs/with/vite) for registry integration.
