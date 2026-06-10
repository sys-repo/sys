# @sys/driver-vite workspace loader authority

- [x] fix(driver-vite): resolve Deno loader authority from workspace root

## Final review

The external report is legitimate. The transport plugin currently derives the `@deno/loader` config
from Vite `envDir/root`, but `envDir` is often the app or package cwd, not the Deno workspace root.

Correct authority order:

```text
app cwd → nearest ancestor Deno workspace deno.json/deno.jsonc → local cwd deno.json
```

Implemented in:

```text
8958d07e2 fix(driver-vite): resolve Deno loader authority from workspace root
```

The S-tier shape is internal and call-site compatible:

- `ViteConfig.app()` remains the policy owner for app-created configs.
- `ViteTransport.denoPlugin()` remains zero-arg compatible for existing callers.
- Direct transport usage becomes workspace-aware as a fallback.
- App-level explicit choices must not be undone by transport guessing.

## Files

Changed in `8958d07e2`:

- `code/sys.driver/driver-vite/src/m.vite.config/-test/-app.test.ts`
- `code/sys.driver/driver-vite/src/m.vite.config/u.app.ts`
- `code/sys.driver/driver-vite/src/m.vite.config/u.plugins.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/-test/-u.resolve.loader.viteIds.test.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/-test/u.fixture.loaderResolver.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/common.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/m.denoPlugin.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/t.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve/u.plugin.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve/u.resolve.ts`

Related authority helpers reviewed:

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/u.workspace.ts`
- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/u.nearest.ts`

## Design implemented

### 1. Optional transport authority

`ViteTransport.denoPlugin` now accepts an optional options bag:

```ts
ViteTransport.denoPlugin({ configPath });
```

The zero-argument call remains valid and unchanged for users.

Current public type truth:

```ts
export type DenoPluginOptions = {
  readonly configPath?: t.StringPath;
  readonly configDiscovery?: 'workspace' | 'local';
};
```

### 2. App-resolved authority is passed internally

`ViteConfig.app()` computes `denoConfig` from `paths.cwd`, not process cwd:

- nearest ancestor workspace `deno.json`/`deno.jsonc` from app cwd when workspace lookup is enabled
- local cwd `deno.json`/`deno.jsonc` when workspace is disabled or absent
- `undefined` when no local config authority exists

This is threaded into `commonPlugins` as internal context. When `denoConfig` exists, the transport
plugin is created with that explicit `configPath`.

Current code truth:

```ts
plugins.push(ViteTransport.denoPlugin(wrangle.denoPluginOptions(context)));

return context.denoConfig
  ? { configPath: context.denoConfig }
  : { configDiscovery: context.configDiscovery ?? 'workspace' };
```

### 3. Direct transport remains smart

When no explicit `configPath` is provided to `denoPlugin`, resolution is lazy from Vite `envDir/root`
according to `configDiscovery`:

- `workspace` (default): find nearest ancestor `deno.json`/`deno.jsonc` whose parsed file has
  `workspace: []`; if none exists, fall back to local config
- `local`: use only local `deno.json`/`deno.jsonc` from `envDir/root`, with no ancestor workspace
  discovery

This keeps raw `ViteTransport.denoPlugin()` usage smart without forcing callers to change config,
while preserving explicit app policy.

### 4. Explicit app policy is preserved

Do not let the driver-owned direct-plugin smart fallback override `ViteConfig.app()` policy. If app
resolution found no config authority, the transport path should not perform its own ancestor
workspace search behind `workspace: false` or a no-config app.

Note: `@deno/loader` may still apply Deno's own workspace semantics when handed a local config that
is itself inside a Deno workspace. The driver can control its own discovery seam; it should not
pretend to override loader substrate semantics.

Use explicit discovery mode:

```ts
ViteTransport.denoPlugin({ configDiscovery: 'workspace' | 'local' });
```

Semantics:

- `configPath` → exact loader authority
- `configDiscovery: 'workspace'` → nearest workspace, else local
- `configDiscovery: 'local'` → driver lookup uses local envDir/root only
- omitted options → default direct-plugin smart mode: `workspace`

`ViteConfig.app()` passes exact `configPath` when it has one, otherwise passes
`configDiscovery: 'local'` to preserve app-level policy.

Current code truth:

```ts
await commonPlugins(options.plugins, {
  denoConfig,
  configDiscovery: 'local',
})
```

### 5. Bare-package importer seam aligned

Bare-package delegation now uses the resolved loader config authority, not `root/deno.json`:

```ts
const importerForResolve = await resolveLoaderConfigPath();
const delegated = await this.resolve(resolved, importerForResolve, {
  ...options,
  skipSelf,
});
```

## Tests

Targeted tests were added/updated around the implemented seams.

Coverage truth:

1. transport direct fallback:
   - fixture has workspace root `deno.json` with `importMap`
   - app/package has nested `deno.json`
   - `configResolved({ root, envDir: packageDir })`
   - resolve import-map alias from workspace root

2. explicit config wins:
   - pass `denoPlugin({ configPath: fixture.configPath })`
   - set `envDir` to a conflicting nested package
   - loader still uses explicit workspace file

3. `ViteConfig.app()` handoff:
   - app cwd is a workspace child
   - root workspace config has import-map authority
   - generated plugin resolves through that root authority

4. app cwd anchoring:
   - process cwd differs from app cwd
   - workspace lookup starts from `paths.cwd`, not process cwd

Targeted validation command:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task test --trace-leaks ./src/m.vite.transport/-test ./src/m.vite.config/-test/-app.test.ts
```

Package validation command:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task check
deno task test
```

## Acceptance

- [x] External workspace package root no longer hides workspace-root `importMap` from `@deno/loader`.
- [x] Existing user `Vite.Config.app(...)` call sites do not change.
- [x] Existing raw `ViteTransport.denoPlugin()` call sites do not change.
- [x] `workspace: false` keeps its app-level alias/discovery meaning without driver-owned ancestor
  search.
- [x] Loader resolution and bare-package delegation share one config authority.

## Implementation reality

Landed as:

```text
8958d07e2 fix(driver-vite): resolve Deno loader authority from workspace root
```

Current behavior:

- direct `ViteTransport.denoPlugin()` defaults to `configDiscovery: 'workspace'`;
- direct transport first finds nearest ancestor Deno workspace config from Vite `envDir/root`;
- direct transport falls back to local `deno.json`/`deno.jsonc` when no workspace authority exists;
- explicit `configPath` wins over discovery;
- `ViteConfig.app()` owns app policy and passes exact `configPath` when resolved;
- when `ViteConfig.app()` has no explicit `denoConfig`, it passes `configDiscovery: 'local'` so
  transport fallback does not undo app-level workspace policy;
- bare package delegation uses the same resolved loader config path.

No follow-up code work remains in this plan.
