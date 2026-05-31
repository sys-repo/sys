# @sys/driver-vite entry/log/config namespace type refactor

- [x] a40b04a90 refactor(driver-vite): move entry log config type spines to namespaces

## Scope

Refactor these public type spines from legacy flat exported names to the canonical namespace spine:

- `code/sys.driver/driver-vite/src/-entry/t.ts` → `ViteEntry.*`
- `code/sys.driver/driver-vite/src/m.fmt/t.ts` → `ViteLog.*`
- `code/sys.driver/driver-vite/src/m.vite.config/t.ts` plus its type factor files → `ViteConfig.*`

Runtime export names stay unchanged:

- `ViteEntry`
- `ViteLog`
- `ViteConfig`

No runtime values move into `t.ts` / `t.*.ts`.

## XHIGH review refinements

Modern comparison read before this plan:

- `code/sys.driver/driver-vite/src/m.vite/t.ts`
- `code/sys.driver/driver-vite/src/m.vite.plugins/m.OptimizeImports/t.ts`
- `code/sys.driver/driver-vite/src/m.vite.transport/t.ts`
- `code/sys/crypto/src/m.Hash.Composite/t.ts`

Patterns to follow:

- `export declare namespace <NS>` owns the public contract.
- `Lib` is first inside the namespace.
- Runtime member groups earn sub-namespaces, for example `ViteLog.Bundle.Lib`.
- Type alias + namespace merging is acceptable when a noun needs both a root type and child detail types, for example `ViteEntry.Args` + `ViteEntry.Args.Dev`.
- Factor files may keep flat local names, but only the root `t.ts` curates the public namespace.

Refinements over the first probe:

- `ViteBundleIO` is not config-owned by current use. Its only live current consumers are `ViteLog` args, so the target home is `ViteLog.Bundle.IO`, not `ViteConfig.BundleIO`.
- `ViteLogDevArgs` has no current caller and no `ViteLog.Dev` runtime owner. Do not manufacture a `Dev` namespace just to preserve stale surface; remove it unless new current caller evidence appears before implementation.
- `m.vite.config.workspace/t.ts` is not in the primary namespace-spine scope. During verification, it required a narrow adjacent update from stale `t.DenoWorkspace` to canonical `t.DenoFile.Workspace.Info` because `@sys/driver-deno/t` had already removed flat compatibility aliases.

## Current legacy flat names → target shape

### `src/-entry/t.ts`

Current public flat names:

- `ViteEntryLib`
- `ViteEntryArgs`
- `ViteEntryArgsDev`
- `ViteEntryArgsBuild`
- `ViteEntryArgsServe`
- `ViteEntryArgsInfo`

Target shape:

```ts
export declare namespace ViteEntry {
  export type Lib = {
    main(argv?: string[] | Args): Promise<void>;
    dev(args: Args.Dev): Promise<void>;
    build(args: Args.Build): Promise<void>;
    serve(args: Args.Serve): Promise<void>;
  };

  export type Args = Args.Dev | Args.Build | Args.Serve | Args.Info;

  export namespace Args {
    export type Dev = { cmd: 'dev'; dir?: P; entry?: P; open?: boolean };
    export type Build = { cmd: 'build'; dir?: P; silent?: boolean };
    export type Serve = { cmd: 'serve'; port?: number; dir?: P; silent?: boolean };
    export type Info = { cmd: 'info'; dir?: P; info?: boolean };
  }
}
```

Reference mapping:

- `t.ViteEntryLib` → `t.ViteEntry.Lib`
- `t.ViteEntryArgs` → `t.ViteEntry.Args`
- `t.ViteEntryArgsDev` → `t.ViteEntry.Args.Dev`
- `t.ViteEntryArgsBuild` → `t.ViteEntry.Args.Build`
- `t.ViteEntryArgsServe` → `t.ViteEntry.Args.Serve`
- `t.ViteEntryArgsInfo` → `t.ViteEntry.Args.Info`

### `src/m.fmt/t.ts`

Current public flat names:

- `ViteLogLib`
- `ViteLogApi`
- `ViteLogUsageApiArgs`
- `ViteLogApiCmd`
- `ViteLogBundleLib`
- `ViteLogModuleLib`
- `ViteLogBundleArgs`
- `ViteLogDevArgs`
- `ViteLogHelpLib`
- `ViteLogHelpArgs`
- `ViteLogDistLib`
- `ViteLogDistOptions`

Target shape:

```ts
export declare namespace ViteLog {
  export type Lib = {
    readonly Bundle: Bundle.Lib;
    readonly Module: Module.Lib;
    readonly Dist: Dist.Lib;
    readonly API: API.Lib;
    readonly Help: Help.Lib;
    pad(text: string, pad?: boolean): string;
    digest(hash?: t.StringHash): string;
    elapsed(msec?: t.Msecs): string;
  };

  export namespace API {
    export type Lib = { log(args?: Args): void };
    export type Args = { cmd?: string; minimal?: boolean; disabled?: Cmd[] };
    export type Cmd = 'dev' | 'build' | 'serve' | 'clean' | 'info';
  }

  export namespace Bundle {
    export type Lib = {
      log(args: Args): void;
      toString(args: Args): string;
    };
    export type Args = { ...; dirs: IO; ... };
    export type IO = { in: t.StringDir; out: t.StringDir };
  }

  export namespace Module {
    export type Lib = {
      log(pkg: t.Pkg): void;
      toString(pkg: t.Pkg): string;
    };
  }

  export namespace Help {
    export type Lib = { log(args: Args): Promise<void> };
    export type Args = { dirs: Bundle.IO; pkg?: t.Pkg; api?: API.Args | false };
  }

  export namespace Dist {
    export type Lib = {
      log(dist: t.DistPkg, options: Options): void;
      toString(dist: t.DistPkg, options: Options): string;
    };
    export type Options = { ...; dirs?: Partial<Bundle.IO>; ... };
  }
}
```

Reference mapping:

- `t.ViteLogLib` → `t.ViteLog.Lib`
- `t.ViteLogApi` → `t.ViteLog.API.Lib`
- `t.ViteLogUsageApiArgs` → `t.ViteLog.API.Args`
- `t.ViteLogApiCmd` → `t.ViteLog.API.Cmd`
- `t.ViteLogBundleLib` → `t.ViteLog.Bundle.Lib`
- `t.ViteLogModuleLib` → `t.ViteLog.Module.Lib`
- `t.ViteLogBundleArgs` → `t.ViteLog.Bundle.Args`
- `t.ViteLogHelpLib` → `t.ViteLog.Help.Lib`
- `t.ViteLogHelpArgs` → `t.ViteLog.Help.Args`
- `t.ViteLogDistLib` → `t.ViteLog.Dist.Lib`
- `t.ViteLogDistOptions` → `t.ViteLog.Dist.Options`
- `t.ViteBundleIO` → `t.ViteLog.Bundle.IO`
- `ViteLogDevArgs` → remove as stale unless a new current caller is found

### `src/m.vite.config/t.ts`

Current public flat names:

- `CodeRegistry`
- `ViteConfigLib`
- `ViteConfigIsLib`
- `ViteConfigAppOptions` from `t.app.ts`
- `ViteConfigPaths` from `t.paths.ts`
- `ViteConfigPathsApp` from `t.paths.ts`
- `ViteBundleIO`
- `ViteConfigCommonPlugins`
- `ViteModuleChunks`
- `ViteModuleChunksArgs`
- `ViteConfigFromFile`

Target shape:

```ts
import type * as TApp from './t.app.ts';
import type * as TPaths from './t.paths.ts';

export declare namespace ViteConfig {
  export type Lib = {
    readonly Is: Is.Lib;
    define(config: t.ViteUserConfigExport): t.ViteUserConfigExport;
    app(options?: App.Options): Promise<t.ViteUserConfig>;
    workspace(options?: t.ViteConfigWorkspaceOptions): Promise<t.ViteDenoWorkspace>;
    alias(registry: string, moduleName: string): t.ViteAlias;
    paths(options?: t.DeepPartial<Paths> | t.StringAbsoluteDir): Paths;
    fromFile(configDir?: t.StringDir): Promise<FromFile>;
  };

  export type CodeRegistry = 'jsr' | 'npm';
  export type CommonPlugins = { deno?: boolean; react?: boolean; wasm?: boolean; optimizeImports?: boolean };
  export type Chunks = (e: Chunks.Args) => void;
  export type Paths = TPaths.Paths;
  export type FromFile = { exists: boolean; paths?: Paths; error?: t.StdError };

  export namespace Is {
    export type Lib = {
      paths(input?: unknown): input is Paths;
    };
  }

  export namespace App {
    export type Options = TApp.Options;
  }

  export namespace Paths {
    export type App = TPaths.App;
  }

  export namespace Chunks {
    export type Args = {
      chunk(alias: string, moduleName?: string | string[]): Args;
    };
  }
}
```

Reference mapping:

- `t.CodeRegistry` → `t.ViteConfig.CodeRegistry`
- `t.ViteConfigLib` → `t.ViteConfig.Lib`
- `t.ViteConfigIsLib` → `t.ViteConfig.Is.Lib`
- `t.ViteConfigAppOptions` → `t.ViteConfig.App.Options`
- `t.ViteConfigPaths` → `t.ViteConfig.Paths`
- `t.ViteConfigPathsApp` → `t.ViteConfig.Paths.App`
- `t.ViteConfigCommonPlugins` → `t.ViteConfig.CommonPlugins`
- `t.ViteModuleChunks` → `t.ViteConfig.Chunks`
- `t.ViteModuleChunksArgs` → `t.ViteConfig.Chunks.Args`
- `t.ViteConfigFromFile` → `t.ViteConfig.FromFile`
- `t.ViteBundleIO` → `t.ViteLog.Bundle.IO`

Factor-file target:

- `src/m.vite.config/t.app.ts` exports `Options` only.
- `src/m.vite.config/t.paths.ts` exports `Paths` and `App` only.
- Neither factor file exports a namespace.
- `src/m.vite.config/t.ts` is the public curator that aliases factor-file shapes into `ViteConfig.App.Options` and `ViteConfig.Paths.App`.

## Source files expected to change

### Entry module

- `code/sys.driver/driver-vite/src/-entry/t.ts`
  - Replace flat exported names with `export declare namespace ViteEntry`.
  - Keep type-plane purity.

- `code/sys.driver/driver-vite/src/-entry/m.Entry.ts`
  - Replace direct `import type { ViteEntryLib } from './t.ts'` with local `type t` lane.
  - Annotate `ViteEntry` as `t.ViteEntry.Lib`.

- `code/sys.driver/driver-vite/src/-entry/m.Entry.main.ts`
  - Update indexed access and argv parse types to `t.ViteEntry.Lib['main']` and `t.ViteEntry.Args`.

- `code/sys.driver/driver-vite/src/-entry/u.build.ts`
  - Update command args type to `t.ViteEntry.Args.Build`.

- `code/sys.driver/driver-vite/src/-entry/u.dev.ts`
  - Update command args type to `t.ViteEntry.Args.Dev`.

- `code/sys.driver/driver-vite/src/-entry/u.serve.ts`
  - Update command args type to `t.ViteEntry.Args.Serve`.

### Log/format module

- `code/sys.driver/driver-vite/src/m.fmt/t.ts`
  - Replace flat exported names with `export declare namespace ViteLog`.
  - Move `ViteBundleIO` to `ViteLog.Bundle.IO`.
  - Remove stale `ViteLogDevArgs` unless new current caller evidence appears.

- `code/sys.driver/driver-vite/src/m.fmt/mod.ts`
  - Replace direct `ViteLogLib` import with local `type t` lane.
  - Annotate `ViteLog` as `t.ViteLog.Lib`.

- `code/sys.driver/driver-vite/src/m.fmt/u.API.ts`
  - Update `t.ViteLogApi` and `t.ViteLogApiCmd` references to `t.ViteLog.API.*`.

- `code/sys.driver/driver-vite/src/m.fmt/u.Bundle.ts`
  - Update `t.ViteLogLib['Bundle']` to `t.ViteLog.Bundle.Lib` or `t.ViteLog.Lib['Bundle']`.

- `code/sys.driver/driver-vite/src/m.fmt/u.Dist.ts`
  - Update `t.ViteLogLib['Dist']` to `t.ViteLog.Dist.Lib` or `t.ViteLog.Lib['Dist']`.

- `code/sys.driver/driver-vite/src/m.fmt/u.Help.ts`
  - Replace direct `ViteLogHelpLib` import with local `type t` lane.
  - Annotate `Help` as `t.ViteLog.Help.Lib`.

- `code/sys.driver/driver-vite/src/m.fmt/u.Module.ts`
  - Update `t.ViteLogLib['Module']` to `t.ViteLog.Module.Lib` or `t.ViteLog.Lib['Module']`.

- `code/sys.driver/driver-vite/src/m.fmt/u.ts`
  - Update `t.ViteLogLib` indexed method references to `t.ViteLog.Lib`.

### Vite config module

- `code/sys.driver/driver-vite/src/m.vite.config/t.ts`
  - Replace root flat exports and `export type *` factor-file leakage with curated `ViteConfig` namespace.
  - Import factor files type-only as namespace aliases.
  - Keep `workspace(...)` typed against existing workspace module types.

- `code/sys.driver/driver-vite/src/m.vite.config/t.app.ts`
  - Rename public factor type from `ViteConfigAppOptions` to local factor `Options`.
  - Update references inside the type to `t.ViteConfig.Paths`, `t.ViteConfig.Chunks`, and `t.ViteConfig.CommonPlugins`.

- `code/sys.driver/driver-vite/src/m.vite.config/t.paths.ts`
  - Rename public factor types from `ViteConfigPaths` and `ViteConfigPathsApp` to local factor `Paths` and `App`.

- `code/sys.driver/driver-vite/src/m.vite.config/m.ViteConfig.ts`
  - Replace direct `ViteConfigLib` import with local `type t` lane.
  - Annotate `define` and `ViteConfig` with `t.ViteConfig.Lib`.

- `code/sys.driver/driver-vite/src/m.vite.config/m.Is.ts`
  - Replace direct `ViteConfigIsLib` import with local `type t` lane.
  - Annotate `Is` as `t.ViteConfig.Is.Lib`.
  - Use `unknown` for the guard input while preserving permissive call semantics.

- `code/sys.driver/driver-vite/src/m.vite.config/u.app.ts`
  - Update `t.ViteConfigLib['app']`, `t.ViteModuleChunksArgs`, and `t.ViteConfigAppOptions` references.

- `code/sys.driver/driver-vite/src/m.vite.config/u.fromFile.ts`
  - Update `t.ViteConfigLib['fromFile']`, `t.ViteConfigFromFile`, and `t.ViteConfigPaths` references.

- `code/sys.driver/driver-vite/src/m.vite.config/u.paths.ts`
  - Update `t.ViteConfigLib['paths']`, `t.ViteConfigPaths`, and `t.ViteConfigPathsApp` references.

- `code/sys.driver/driver-vite/src/m.vite.config/u.plugins.ts`
  - Update `t.ViteConfigCommonPlugins` to `t.ViteConfig.CommonPlugins`.

### Adjacent in-scope consumers

- `code/sys.driver/driver-vite/src/m.vite.config.workspace/mod.ts`
  - Update `t.ViteConfigLib['workspace']` to `t.ViteConfig.Lib['workspace']`.

- `code/sys.driver/driver-vite/src/m.vite/t.ts`
  - Update `t.ViteConfigLib` and `t.ViteConfigPaths` references.

- `code/sys.driver/driver-vite/src/m.vite/u.keyboard.ts`
  - Update `t.ViteConfigPaths` to `t.ViteConfig.Paths`.

- `code/sys.driver/driver-vite/src/m.vite/u.log.ts`
  - Update `t.ViteLogBundleArgs` to `t.ViteLog.Bundle.Args`.
  - Update `t.ViteConfigPaths` to `t.ViteConfig.Paths`.

- `code/sys.driver/driver-vite/src/m.vite/u.wrangle.ts`
  - Update `t.ViteConfigPaths` to `t.ViteConfig.Paths`.

### Tests and test helpers

- `code/sys.driver/driver-vite/src/m.vite/-test/-build.test.ts`
  - Update `t.ViteConfigPaths` references.

- `code/sys.driver/driver-vite/src/m.vite/-test/-build.workspace-composition.test.ts`
  - Update `t.ViteConfigPaths` references.

- `code/sys.driver/driver-vite/src/m.vite/-test/-u.keyboard.test.ts`
  - Update `t.ViteConfigPaths` references.

- `code/sys.driver/driver-vite/src/m.vite.config/-test/-.test.ts`
  - Update `t.CodeRegistry` to `t.ViteConfig.CodeRegistry`.

- `code/sys.driver/driver-vite/src/m.vite.config/-test/-paths.test.ts`
  - Update test prose from `[ViteConfigPaths]` to `[ViteConfig.Paths]` to avoid stale residue.

- `code/sys.driver/driver-vite/src/m.vite.config/-test/-app.test.ts`
  - Update `t.ViteConfigPaths` references.

- `code/sys.driver/driver-vite/src/m.vite.config/-test/-fromFile.test.ts`
  - Update `t.ViteConfigFromFile` references and stale console label text.

- `code/sys.driver/driver-vite/src/m.vite.config/-test/u.fixture.fromFile.ts`
  - Update `t.ViteConfigFromFile` cast.

## Source files expected not to change

- `code/sys.driver/driver-vite/src/types.ts`
  - It already re-exports the target `t.ts` files. The public type pool should update through the refactored spines without changing this barrel.

- `code/sys.driver/driver-vite/src/common/t.ts`
  - Final reality: changed to import canonical `DenoFile` and `DenoDeps` namespaces from `@sys/driver-deno/t` after verification exposed stale flat `DenoFile*` / `DenoWorkspace*` type imports.

- Runtime `mod.ts` export names
  - `ViteEntry`, `ViteLog`, and `ViteConfig` remain the value API.

## Legacy alias disposition

Do not add compatibility aliases.

Current live caller evidence is fully migratable in this package. Direct legacy imports found during review:

- `src/-entry/m.Entry.ts` imports `ViteEntryLib` from `./t.ts`.
- `src/m.fmt/mod.ts` imports `ViteLogLib` from `./t.ts`.
- `src/m.fmt/u.Help.ts` imports `ViteLogHelpLib` from `./t.ts`.
- `src/m.vite.config/m.ViteConfig.ts` imports `ViteConfigLib` from `./t.ts`.
- `src/m.vite.config/m.Is.ts` imports `ViteConfigIsLib` from `./t.ts`.

All are in-scope and must migrate to the canonical local `type t` lane.

No current caller requires a legacy alias. If a new current caller appears during the implementation residue search and cannot be migrated in the same refactor, HOLD and name that caller before adding any alias.

## Implementation sequence

1. Rewrite `src/-entry/t.ts` to `ViteEntry.Lib` and `ViteEntry.Args.*`.
2. Migrate entry implementation files to `t.ViteEntry.*`; remove direct type imports from `./t.ts`.
3. Rewrite `src/m.fmt/t.ts` to `ViteLog.Lib` and runtime-owned sub-namespaces.
4. Migrate log implementation files to `t.ViteLog.*` and move bundle IO references to `t.ViteLog.Bundle.IO`.
5. Rewrite `src/m.vite.config/t.paths.ts` and `t.app.ts` as local factor files.
6. Rewrite `src/m.vite.config/t.ts` to curated `ViteConfig.*` namespace.
7. Migrate config implementation files and adjacent config workspace implementation annotation.
8. Migrate `src/m.vite` type references and tests.
9. Run residue search for all removed flat names; if any remain, migrate them or HOLD with exact caller evidence.
10. Run module task verification.

## Verification commands

Run from the nearest module root:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
```

Targeted check/test:

```sh
deno task check
deno task test --trace-leaks ./src/-entry
deno task test --trace-leaks ./src/m.fmt
deno task test --trace-leaks ./src/m.vite.config
deno task test --trace-leaks ./src/m.vite
```

Residue search after migration:

```sh
rg -n "\b(ViteEntryLib|ViteEntryArgs(?:Dev|Build|Serve|Info)?|ViteLogLib|ViteLogApi|ViteLogUsageApiArgs|ViteLogApiCmd|ViteLogBundleLib|ViteLogModuleLib|ViteLogBundleArgs|ViteLogDevArgs|ViteLogHelpLib|ViteLogHelpArgs|ViteLogDistLib|ViteLogDistOptions|ViteConfigLib|ViteConfigIsLib|ViteConfigAppOptions|ViteConfigPaths(?:App)?|ViteConfigCommonPlugins|ViteModuleChunks(?:Args)?|ViteConfigFromFile|ViteBundleIO|CodeRegistry)\b" src
```

Final package proof if targeted runs pass:

```sh
deno task test
```

## HOLD conditions

HOLD before implementation or before closing the implementation if any of these occur:

- A legacy flat name remains in a source file after migration and cannot be migrated in the same clean refactor.
- A concrete current caller for `ViteLogDevArgs` appears; decide whether to map it to `ViteLog.Dev.Args` or defer alias/removal to a separate approved pass.
- Any proposed edit would import runtime modules, export runtime values, or perform side effects from `t.ts` / `t.*.ts`.
- Any implementation change would alter runtime value exports or behavior beyond type annotation/reference updates.
- Any compatibility alias is proposed without exact current caller evidence.

## Final reality

Implementation landed in:

- `a40b04a9010840293b51d905e4a7d92dac357f64` `refactor(driver-vite): move entry log config type spines to namespaces`

Actual changes:

- Converted `src/-entry/t.ts` from flat `ViteEntryLib` / `ViteEntryArgs*` exports to `ViteEntry.Lib` and `ViteEntry.Args.*`.
- Converted `src/m.fmt/t.ts` from flat `ViteLog*` exports to `ViteLog.Lib` with `API`, `Bundle`, `Module`, `Help`, and `Dist` sub-namespaces.
- Removed stale `ViteLogDevArgs`; no current caller evidence existed.
- Converted `src/m.vite.config/t.ts` to curated `ViteConfig.Lib` / `ViteConfig.*` namespace, with `t.app.ts` and `t.paths.ts` as local factor files.
- Migrated in-scope callers, tests, and helper annotations to the canonical local `type t` pool.
- Migrated `driver-vite` off removed `@sys/driver-deno/t` flat names to canonical namespace types: `DenoFile.Lib`, `DenoFile.Json`, `DenoFile.FilePath`, `DenoFile.ImportMap.Json`, `DenoFile.Workspace.Info`, and `DenoFile.Workspace.Child`.
- Preserved runtime value exports: `ViteEntry`, `ViteLog`, `ViteConfig`.
- Added no compatibility alias blocks.

Final verification/proof:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task check
deno task test --trace-leaks ./-scripts
deno task test --trace-leaks ./src/m.vite.config.workspace
deno task test --trace-leaks ./src/m.vite.plugins/m.OptimizeImports
deno task test --trace-leaks ./src/m.vite.config
deno task test --trace-leaks ./src/m.vite
deno task test
rg -n "\\b(ViteEntryLib|ViteEntryArgs(?:Dev|Build|Serve|Info)?|ViteLogLib|ViteLogApi|ViteLogUsageApiArgs|ViteLogApiCmd|ViteLogBundleLib|ViteLogModuleLib|ViteLogBundleArgs|ViteLogDevArgs|ViteLogHelpLib|ViteLogHelpArgs|ViteLogDistLib|ViteLogDistOptions|ViteConfigLib|ViteConfigIsLib|ViteConfigAppOptions|ViteConfigPaths(?:App)?|ViteConfigCommonPlugins|ViteModuleChunks(?:Args)?|ViteConfigFromFile|ViteBundleIO|DenoFileJson|DenoFileLib|DenoFilePath|DenoImportMapJson|DenoWorkspace|DenoWorkspaceChild)\\b" code/sys.driver/driver-vite
```

Proof result:

- `deno task check` passed.
- `deno task test` passed: `47 passed (248 steps) | 0 failed`.
- Residue search returned no matches for removed legacy flat Vite/Deno type names.

Final review result:

- SHIP.

Remaining risk:

- External consumers of the removed flat type names must migrate to the namespace surfaces. No in-repo caller required compatibility aliases.
