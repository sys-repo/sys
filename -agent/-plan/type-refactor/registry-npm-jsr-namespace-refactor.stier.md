# @sys/registry npm/jsr namespace refactor

- [x] plan(create): registry npm/jsr namespace refactor
- [x] 045386d6d refactor(registry): align npm and jsr type surfaces with namespace spine
- [ ] plan(update): registry npm/jsr final reality
- [ ] docs(type-refactor): retire spent registry npm/jsr plan after namespace refactor

## Scope

Package: `@sys/registry`.

Target type surfaces:

- `code/sys/registry/src/m.npm/**/t.ts`
- `code/sys/registry/src/m.jsr/**/t.ts`
- `code/sys/registry/src/t.ts` package public type aggregation, as needed to point at the new canonical names.

Runtime surfaces that must remain stable:

- `Npm`, `Fetch`, `Is`, and `Import` from `code/sys/registry/src/m.npm/**/mod.ts`.
- `Jsr`, `Fetch`, `Is`, `Import`, and `Manifest` from `code/sys/registry/src/m.jsr/**/mod.ts`.
- Package exports in `code/sys/registry/deno.json`.

Non-goals:

- Do not change npm/jsr URL formatting, fetch behavior, manifest pull/write behavior, error semantics, or package exports.
- Do not move runtime values into `t.ts` or `t.*.ts`.
- Do not create deprecated compatibility alias blocks.
- Do not split one exported `Npm` or `Jsr` namespace across several re-exported files; star-barrel conflicts are an implementation hazard.
- Do not refactor unrelated `@sys/registry` root runtime modules.

## XHIGH refinement result

The probe direction is correct that registry npm/jsr surfaces still carry legacy flat `XxxLib` spines, but the initial package-level `Npm.*`/`Jsr.*` shape needs one refinement:

- Avoid declaring `export namespace Npm` or `export namespace Jsr` independently in multiple sibling `t.ts` files that are later `export type *` re-exported by `m.npm/t.ts`, `m.jsr/t.ts`, or `common/t.ts`. That risks ambiguous star exports rather than a reliable merged namespace.
- Use module-local, collision-free namespace roots in the adjacent `t.ts` files: `NpmClient`, `NpmServer`, `NpmFetch`, `NpmIs`, `NpmImport`, `JsrClient`, `JsrServer`, `JsrFetch`, `JsrIs`, `JsrImport`, and `JsrManifest`.
- Keep the public package aggregation in `code/sys/registry/src/t.ts` as `Registry.Npm.*` and `Registry.Jsr.*`, but update it to point to the new module-local namespace members instead of legacy flat names.

Modern comparison reference read for this plan:

- `code/sys/fs/src/m.FileMap/t.ts` — namespace-first surface with `FileMap.Lib` first, earned sub-namespaces, and type-plane-only declarations.

The implementation is rejected unless all `t.ts` / `t.*.ts` files remain type-plane pure: type-only imports, `export declare namespace`, `export type`, and non-exported helper types only.

## Current legacy flat names

### npm

`code/sys/registry/src/m.npm/m.client/m.Npm/t.ts`:

- `NpmClientLib`

`code/sys/registry/src/m.npm/m.server/m.Npm/t.ts`:

- `NpmServerLib`

`code/sys/registry/src/m.npm/m.client/m.Is/t.ts`:

- `NpmIsLib`

`code/sys/registry/src/m.npm/m.client/m.Import/t.ts`:

- `NpmImportLib`

`code/sys/registry/src/m.npm/m.client/m.Fetch/t.ts` currently already has `NpmFetch.Lib`, but still exposes legacy flat aliases:

- `NpmFetchLib`
- `NpmFetchPkgLib`
- `NpmFetchPkgOptions`
- `NpmFetchPkgVersionsResponse`
- `NpmFetchPkgInfoResponse`
- `NpmPkgMetaVersions`
- `NpmPkgMetaVersion`
- `NpmPkgVersionInfo`
- `NpmPkgDistInfo`
- `NpmUrlLib`
- `NpmUrlPkgLib`

### jsr

`code/sys/registry/src/m.jsr/m.client/m.Jsr/t.ts`:

- `JsrClientLib`

`code/sys/registry/src/m.jsr/m.server/m.Jsr/t.ts`:

- `JsrServerLib`

`code/sys/registry/src/m.jsr/m.client/m.Is/t.ts`:

- `JsrIsLib`

`code/sys/registry/src/m.jsr/m.client/m.Import/t.ts`:

- `JsrImportLib`

`code/sys/registry/src/m.jsr/m.client/m.Fetch/t.ts` currently already has `JsrFetch.Lib`, but still exposes legacy flat aliases:

- `JsrFetchLib`
- `JsrFetchPkgLib`
- `JsrFetchPkgOptions`
- `JsrFetchPkgChecksumOptions`
- `JsrFetchPkgVersionsResponse`
- `JsrFetchPkgInfoResponse`
- `JsrFetchPkgFileResponse`
- `JsrPkgMetaVersions`
- `JsrPkgMetaVersion`
- `JsrPkgVersionInfo`
- `JsrPkgGraph`
- `JsrPkgGraphModule`
- `JsrPkgGraphDependency`
- `JsrPkgManifest`
- `JsrPkgManifestFile`
- `JsrPkgFileFetcher`

`code/sys/registry/src/m.jsr/m.server/m.Manifest/t.ts`:

- `JsrManifestLib`
- `JsrManifest`
- `JsrManifestFetchResponse`
- `JsrManifestFetchSuccess`
- `JsrManifestFetchFail`
- `JsrManifestPullResponse`
- `JsrManifestPullOptions`

`code/sys/registry/src/t.ts` currently re-exposes many of those flat names through `Registry.Jsr.*`, `Registry.Jsr.Fetch.*`, `Registry.Npm.*`, and `Registry.Npm.Fetch.*` aliases.

## Target namespace shape

### npm client root

`code/sys/registry/src/m.npm/m.client/m.Npm/t.ts`:

```ts
import type { t } from './common.ts';

/** Tools for working with the npm registry. */
export declare namespace NpmClient {
  export type Lib = {
    readonly Fetch: t.NpmFetch.Lib;
    readonly Is: t.NpmIs.Lib;
    readonly Import: t.NpmImport.Lib;
    readonly Url: t.NpmFetch.Url.Lib;
  };
}
```

### npm server root

`code/sys/registry/src/m.npm/m.server/m.Npm/t.ts`:

```ts
import type { t } from './common.ts';

/** Tools for working with the npm registry on the server. */
export declare namespace NpmServer {
  export type Lib = t.NpmClient.Lib;
}
```

### npm predicates/imports

`code/sys/registry/src/m.npm/m.client/m.Is/t.ts`:

```ts
/** npm package-name predicates. */
export declare namespace NpmIs {
  export type Lib = {
    readonly pkgName: (input: string) => boolean;
  };
}
```

`code/sys/registry/src/m.npm/m.client/m.Import/t.ts`:

```ts
/** Tools for formatting `npm:` import specifiers. */
export declare namespace NpmImport {
  export type Lib = {
    readonly specifier: (pkg: string, version: string, suffix?: string) => string;
  };
}
```

### npm fetch and URL helpers

`code/sys/registry/src/m.npm/m.client/m.Fetch/t.ts`:

```ts
import type { t } from './common.ts';

/** Network fetching helpers against the npm registry end-point. */
export declare namespace NpmFetch {
  export type Lib = {
    readonly Pkg: Pkg.Lib;
    readonly Url: Url.Lib;
  };

  export namespace Pkg {
    export type Lib = {
      versions(name: string, options?: Options): Promise<VersionsResponse>;
      info(name: string, version?: t.StringSemver, options?: Options): Promise<InfoResponse>;
    };

    export type Options = { until?: t.UntilInput };
    export type VersionsResponse = t.FetchResponse<MetaVersions>;
    export type InfoResponse = t.FetchResponse<VersionInfo>;
    export type MetaVersions = {
      name: string;
      latest: t.StringSemver;
      versions: { [version: string]: MetaVersion };
    };
    export type MetaVersion = { deprecated?: string };
    export type VersionInfo = {
      pkg: t.Pkg;
      dist?: DistInfo;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      exports?: unknown;
    };
    export type DistInfo = {
      tarball?: string;
      integrity?: string;
      shasum?: string;
    };
  }

  export namespace Url {
    export type Lib = { readonly Pkg: Pkg.Lib };

    export namespace Pkg {
      export type Lib = {
        metadata(name: string): string;
        version(name: string, version: t.StringSemver): string;
      };
    }
  }
}
```

### jsr client root

`code/sys/registry/src/m.jsr/m.client/m.Jsr/t.ts`:

```ts
import type { t } from './common.ts';

/** Tools for working with JSR ("the Javascript Registry"). */
export declare namespace JsrClient {
  export type Lib = {
    readonly Fetch: t.JsrFetch.Lib;
    readonly Is: t.JsrIs.Lib;
    readonly Import: t.JsrImport.Lib;
    readonly Url: t.JsrFetch.Lib['Url'];
  };
}
```

### jsr server root

`code/sys/registry/src/m.jsr/m.server/m.Jsr/t.ts`:

```ts
import type { t } from './common.ts';

/** Tools for working with JSR ("the Javascript Registry") on the server. */
export declare namespace JsrServer {
  export type Lib = t.JsrClient.Lib & {
    readonly Manifest: t.JsrManifest.Lib;
    readonly manifest: t.JsrManifest.Lib['fetch'];
  };
}
```

### jsr predicates/imports

`code/sys/registry/src/m.jsr/m.client/m.Is/t.ts`:

```ts
/** JSR package-name predicates. */
export declare namespace JsrIs {
  export type Lib = {
    readonly pkgName: (input: string) => boolean;
  };
}
```

`code/sys/registry/src/m.jsr/m.client/m.Import/t.ts`:

```ts
/** Tools for formatting `jsr:` import specifiers. */
export declare namespace JsrImport {
  export type Lib = {
    readonly specifier: (pkg: string, version: string, suffix?: string) => string;
  };
}
```

### jsr fetch helpers

`code/sys/registry/src/m.jsr/m.client/m.Fetch/t.ts`:

```ts
import type { t } from './common.ts';

/** Network fetching helpers against the "jsr.io" end-point. */
export declare namespace JsrFetch {
  export type Lib = {
    readonly Pkg: Pkg.Lib;
    readonly Url: t.JsrUrl.Lib;
  };

  export namespace Pkg {
    export type Lib = {
      versions(name: string, options?: Options): Promise<VersionsResponse>;
      info(name: t.StringPkgName, version?: t.StringSemver, options?: Options): Promise<InfoResponse>;
      file(name: t.StringPkgName, version: t.StringSemver, options?: Options): FileFetcher;
    };

    export type Options = { until?: t.UntilInput };
    export type ChecksumOptions = Options & { checksum?: t.StringHash };
    export type VersionsResponse = t.FetchResponse<MetaVersions>;
    export type InfoResponse = t.FetchResponse<VersionInfo>;
    export type FileResponse = t.FetchResponse<string>;
    export type MetaVersions = {
      scope: string;
      name: string;
      latest: t.StringSemver;
      versions: { [version: string]: MetaVersion };
    };
    export type MetaVersion = { yanked?: boolean };
    export type VersionInfo = {
      readonly pkg: t.Pkg;
      readonly manifest?: Manifest;
      readonly exports?: { readonly [key: string]: string };
      readonly graph?: Graph;
    };
    export type Graph = { readonly format: 1 | 2; readonly modules: readonly GraphModule[] };
    export type GraphModule = {
      readonly path: string;
      readonly dependencies: readonly GraphDependency[];
    };
    export type GraphDependency = { readonly specifier: string; readonly kind?: string };
    export type Manifest = { [path: string]: ManifestFile };
    export type ManifestFile = { readonly size: number; readonly checksum: string };
    export type FileFetcher = {
      pkg: t.Pkg;
      text(path: t.StringPath, options?: ChecksumOptions): Promise<FileResponse>;
    };
  }
}
```

### jsr manifest helpers

`code/sys/registry/src/m.jsr/m.server/m.Manifest/t.ts`:

```ts
import type { t } from './common.ts';

/** Tools for working with a module's source-code. */
export declare namespace JsrManifest {
  export type Lib = {
    create(pkg: t.Pkg, def: t.JsrFetch.Pkg.Manifest): Instance;
    fetch(
      name: t.StringPkgName,
      version?: t.StringSemver,
      options?: t.JsrFetch.Pkg.Options,
    ): Promise<Fetch.Response>;
  };

  export type Instance = {
    readonly pkg: t.Pkg;
    readonly def: t.JsrFetch.Pkg.Manifest;
    readonly paths: t.StringPath[];
    pull(options?: Pull.Options | t.StringDir): Promise<Pull.Response>;
  };

  export namespace Fetch {
    export type Response = Success | Fail;
    export type Success = Common & {
      readonly manifest: Instance;
      readonly error?: undefined;
    };
    export type Fail = Common & {
      readonly error: t.StdError;
      readonly manifest?: never;
    };
    type Common = {
      readonly ok: boolean;
      readonly status: t.HttpStatusCode;
      readonly origin: t.StringUrl;
    };
  }

  export namespace Pull {
    export type Response = {
      ok: boolean;
      files: t.JsrFetch.Pkg.FileResponse[];
      error?: t.StdError;
      written?: {
        absolute: t.StringDir;
        relative: t.StringDir;
        total: { files: t.NumberTotal };
      };
    };
    export type Options = {
      until?: t.UntilInput;
      write?: t.StringDir;
      filter?: t.Fs.Path.Filter;
    };
  }
}
```

### package public aggregation

`code/sys/registry/src/t.ts` should preserve the public `Registry` namespace but update its members to the new namespace spines:

```ts
export declare namespace Registry {
  export namespace Jsr {
    export namespace Client { export type Lib = J.JsrClient.Lib }
    export namespace Server { export type Lib = J.JsrServer.Lib }
    export namespace Import { export type Lib = J.JsrImport.Lib }
    export namespace Manifest {
      export type Lib = J.JsrManifest.Lib;
      export type Instance = J.JsrManifest.Instance;
      export namespace Fetch { export type Response = J.JsrManifest.Fetch.Response }
      export namespace Pull {
        export type Options = J.JsrManifest.Pull.Options;
        export type Response = J.JsrManifest.Pull.Response;
      }
    }
    export namespace Fetch { /* J.JsrFetch.* mappings */ }
  }

  export namespace Npm {
    export namespace Client { export type Lib = N.NpmClient.Lib }
    export namespace Server { export type Lib = N.NpmServer.Lib }
    export namespace Import { export type Lib = N.NpmImport.Lib }
    export namespace Url { export type Lib = N.NpmFetch.Url.Lib }
    export namespace Fetch { /* N.NpmFetch.* mappings */ }
  }
}
```

No `Registry.Jsr.ClientLib`, `Registry.Npm.Fetch.PkgLib`, or similar flat compatibility aliases should remain unless final caller search proves an unmigratable current in-repo caller.

## Legacy alias disposition

Remove flat aliases rather than preserving or adding deprecated alias blocks.

Caller evidence from the probe found only current in-repo callers that can be migrated:

- `code/sys/registry/src/t.ts`
- `code/sys/registry/src/m.npm/m.client/m.Npm/mod.ts`
- `code/sys/registry/src/m.npm/m.server/mod.ts`
- `code/sys/registry/src/m.npm/m.client/m.Is/mod.ts`
- `code/sys/registry/src/m.npm/m.client/m.Import/mod.ts`
- `code/sys/registry/src/m.npm/m.client/m.Fetch/m.Url.ts`
- `code/sys/registry/src/m.npm/m.client/m.Fetch/m.Fetch.Pkg.ts`
- `code/sys/registry/src/m.npm/m.server/m.Npm/t.ts`
- `code/sys/registry/src/m.jsr/m.client/m.Jsr/mod.ts`
- `code/sys/registry/src/m.jsr/m.server/m.Jsr/mod.ts`
- `code/sys/registry/src/m.jsr/m.client/m.Is/mod.ts`
- `code/sys/registry/src/m.jsr/m.client/m.Import/mod.ts`
- `code/sys/registry/src/m.jsr/m.client/m.Fetch/m.Fetch.Pkg.ts`
- `code/sys/registry/src/m.jsr/m.client/m.Fetch/u.graph.ts`
- `code/sys/registry/src/m.jsr/m.server/m.Manifest/mod.ts`
- `code/sys/registry/src/m.jsr/m.server/m.Manifest/u.create.ts`
- `code/sys/registry/src/m.jsr/m.server/m.Manifest/u.fetch.ts`

There is no exact live caller evidence requiring alias retention. If implementation discovers one, HOLD and report the exact caller instead of adding aliases.

## Source files expected to change

### npm type spines

- `code/sys/registry/src/m.npm/m.client/m.Npm/t.ts`
  - Replace `NpmClientLib` with `NpmClient.Lib`.
  - Update references to `t.NpmIs.Lib`, `t.NpmImport.Lib`, and `t.NpmFetch.Url.Lib`.

- `code/sys/registry/src/m.npm/m.server/m.Npm/t.ts`
  - Replace `NpmServerLib` with `NpmServer.Lib`.
  - Reference `t.NpmClient.Lib`.

- `code/sys/registry/src/m.npm/m.client/m.Is/t.ts`
  - Replace `NpmIsLib` with `NpmIs.Lib`.

- `code/sys/registry/src/m.npm/m.client/m.Import/t.ts`
  - Replace `NpmImportLib` with `NpmImport.Lib`.

- `code/sys/registry/src/m.npm/m.client/m.Fetch/t.ts`
  - Keep `NpmFetch.Lib` as the primary surface.
  - Move package fetch details under `NpmFetch.Pkg.*`.
  - Move URL helpers under `NpmFetch.Url.*`.
  - Remove all legacy flat `NpmFetch*`, `NpmPkg*`, and `NpmUrl*` aliases.

### jsr type spines

- `code/sys/registry/src/m.jsr/m.client/m.Jsr/t.ts`
  - Replace `JsrClientLib` with `JsrClient.Lib`.
  - Update references to `t.JsrIs.Lib`, `t.JsrImport.Lib`, and `t.JsrFetch.Lib`.

- `code/sys/registry/src/m.jsr/m.server/m.Jsr/t.ts`
  - Replace `JsrServerLib` with `JsrServer.Lib`.
  - Reference `t.JsrClient.Lib` and `t.JsrManifest.Lib`.

- `code/sys/registry/src/m.jsr/m.client/m.Is/t.ts`
  - Replace `JsrIsLib` with `JsrIs.Lib`.

- `code/sys/registry/src/m.jsr/m.client/m.Import/t.ts`
  - Replace `JsrImportLib` with `JsrImport.Lib`.

- `code/sys/registry/src/m.jsr/m.client/m.Fetch/t.ts`
  - Keep `JsrFetch.Lib` as the primary surface.
  - Move package fetch details under `JsrFetch.Pkg.*`.
  - Remove all legacy flat `JsrFetch*` and `JsrPkg*` aliases.

- `code/sys/registry/src/m.jsr/m.server/m.Manifest/t.ts`
  - Replace flat manifest aliases with `JsrManifest.Lib`, `JsrManifest.Instance`, `JsrManifest.Fetch.*`, and `JsrManifest.Pull.*`.
  - Keep local helper common types non-exported unless they are conceptually public.

### Package aggregation

- `code/sys/registry/src/t.ts`
  - Update `Registry.Jsr.*` and `Registry.Npm.*` mappings to the new namespace members.
  - Prefer nested `Registry.Npm.Client.Lib`, `Registry.Npm.Fetch.Pkg.Options`, `Registry.Jsr.Manifest.Fetch.Response`, etc.
  - Remove flat aggregation aliases that only point at removed legacy names.

### npm implementation references

- `code/sys/registry/src/m.npm/m.client/m.Npm/mod.ts`
  - `t.NpmClientLib` -> `t.NpmClient.Lib`.

- `code/sys/registry/src/m.npm/m.server/mod.ts`
  - `t.NpmServerLib` -> `t.NpmServer.Lib`.

- `code/sys/registry/src/m.npm/m.client/m.Is/mod.ts`
  - `t.NpmIsLib` -> `t.NpmIs.Lib`.

- `code/sys/registry/src/m.npm/m.client/m.Import/mod.ts`
  - Replace direct `NpmImportLib` import with `NpmImport.Lib`, or add/use a local `type t` lane only if a suitable `common.ts` already exists or is intentionally introduced.

- `code/sys/registry/src/m.npm/m.client/m.Fetch/m.Url.ts`
  - `t.NpmUrlLib` -> `t.NpmFetch.Url.Lib`.

- `code/sys/registry/src/m.npm/m.client/m.Fetch/m.Fetch.Pkg.ts`
  - `t.NpmFetch.PkgLib` -> `t.NpmFetch.Pkg.Lib`.
  - `t.NpmFetch.PkgMetaVersions` -> `t.NpmFetch.Pkg.MetaVersions`.
  - `t.NpmFetch.PkgVersionInfo` -> `t.NpmFetch.Pkg.VersionInfo`.
  - `t.NpmFetch.PkgDistInfo` -> `t.NpmFetch.Pkg.DistInfo`.

### jsr implementation references

- `code/sys/registry/src/m.jsr/m.client/m.Jsr/mod.ts`
  - `t.JsrClientLib` -> `t.JsrClient.Lib`.

- `code/sys/registry/src/m.jsr/m.server/m.Jsr/mod.ts`
  - Replace direct `JsrServerLib` import with local `type t` lane and `t.JsrServer.Lib`.

- `code/sys/registry/src/m.jsr/m.client/m.Is/mod.ts`
  - `t.JsrIsLib` -> `t.JsrIs.Lib`.

- `code/sys/registry/src/m.jsr/m.client/m.Import/mod.ts`
  - Replace direct `JsrImportLib` import with `JsrImport.Lib`, or add/use a local `type t` lane only if a suitable `common.ts` already exists or is intentionally introduced.

- `code/sys/registry/src/m.jsr/m.client/m.Fetch/m.Fetch.Pkg.ts`
  - `t.JsrFetch.PkgLib` -> `t.JsrFetch.Pkg.Lib`.
  - `t.JsrFetch.PkgMetaVersions` -> `t.JsrFetch.Pkg.MetaVersions`.
  - `t.JsrFetch.PkgVersionsResponse` -> `t.JsrFetch.Pkg.VersionsResponse`.
  - `t.JsrFetch.PkgVersionInfo` -> `t.JsrFetch.Pkg.VersionInfo`.
  - `t.JsrFetch.PkgFileFetcher` -> `t.JsrFetch.Pkg.FileFetcher`.

- `code/sys/registry/src/m.jsr/m.client/m.Fetch/u.graph.ts`
  - `t.JsrFetch.PkgManifest` -> `t.JsrFetch.Pkg.Manifest`.
  - `t.JsrFetch.PkgGraph` -> `t.JsrFetch.Pkg.Graph`.
  - `t.JsrFetch.PkgGraphModule` -> `t.JsrFetch.Pkg.GraphModule`.
  - `t.JsrFetch.PkgGraphDependency` -> `t.JsrFetch.Pkg.GraphDependency`.

- `code/sys/registry/src/m.jsr/m.server/m.Manifest/mod.ts`
  - Replace direct `JsrManifestLib` import with local `type t` lane and `t.JsrManifest.Lib`.

- `code/sys/registry/src/m.jsr/m.server/m.Manifest/u.create.ts`
  - `t.JsrManifestLib['create']` -> `t.JsrManifest.Lib['create']`.
  - `t.JsrManifest` -> `t.JsrManifest.Instance`.
  - `Parameters<t.JsrManifest['pull']>[0]` -> `Parameters<t.JsrManifest.Instance['pull']>[0]` or `t.JsrManifest.Pull.Options | t.StringDir | undefined`.
  - `t.JsrManifestPullOptions` -> `t.JsrManifest.Pull.Options`.
  - `t.JsrManifestPullResponse` -> `t.JsrManifest.Pull.Response`.

- `code/sys/registry/src/m.jsr/m.server/m.Manifest/u.fetch.ts`
  - `t.JsrManifestLib['fetch']` -> `t.JsrManifest.Lib['fetch']`.

- `code/sys/registry/src/m.jsr/m.server/m.Manifest/-test.external/run.ts`
  - If residue search flags string-only labels such as `JsrManifestFetchResponse`, update the label to the canonical `JsrManifest.Fetch.Response` form. Do not change test behavior.

## Expected unchanged files

- `code/sys/registry/deno.json`
- Runtime `mod.ts` exports, except for type annotations/import lanes listed above.
- Fetch/url/manifest implementation logic, except for type-reference renames listed above.
- `code/sys/registry/src/common/t.ts`, unless `deno task check` shows a type-pool export ambiguity that must be resolved by type-only exports.

## Implementation sequence

1. Refactor the npm type spines to `NpmClient.Lib`, `NpmServer.Lib`, `NpmIs.Lib`, `NpmImport.Lib`, `NpmFetch.Pkg.*`, and `NpmFetch.Url.*`; remove npm flat aliases.
2. Update npm implementation annotations and direct type imports to canonical namespace names.
3. Refactor the jsr type spines to `JsrClient.Lib`, `JsrServer.Lib`, `JsrIs.Lib`, `JsrImport.Lib`, `JsrFetch.Pkg.*`, and `JsrManifest.*`; remove jsr flat aliases.
4. Update jsr implementation annotations and direct type imports to canonical namespace names.
5. Update `code/sys/registry/src/t.ts` package aggregation to nested `Registry.Npm.*` and `Registry.Jsr.*` mappings that point at the new namespace members.
6. Run residue search for removed legacy alias names and update stale comments/string labels only when they refer to the old type names.
7. Run the nearest module verification commands.

## HOLD conditions

HOLD and ask before continuing if any of these occur:

- A concrete current caller cannot be migrated to the new namespace names in this change.
- TypeScript rejects the module-local namespace spines through `common/t.ts` or the public `Registry` aggregation and the fix would require cross-file `Npm`/`Jsr` namespace merging through star barrels.
- The refactor appears to require changing runtime exports, package exports, URL formatting, fetch behavior, manifest pull/write behavior, or error semantics.
- The implementation would require adding deprecated compatibility alias blocks.
- External public compatibility for removed flat aliases is declared mandatory for this package version.
- `deno task check` reveals that `Registry.Npm.*`/`Registry.Jsr.*` aggregation shape is consumed in a way that requires keeping flat `ClientLib`, `PkgLib`, or similar aliases.

## Verification

Run from the nearest module task surface:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/registry && deno fmt --check ./src/m.npm ./src/m.jsr ./src/t.ts
cd /Users/phil/code/org.sys/sys/code/sys/registry && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/registry && deno task test
```

Residue search after edits:

```sh
rg -n "\\b(NpmClientLib|NpmServerLib|NpmIsLib|NpmImportLib|NpmFetchLib|NpmFetchPkgLib|NpmFetchPkgOptions|NpmFetchPkgVersionsResponse|NpmFetchPkgInfoResponse|NpmPkgMetaVersions|NpmPkgMetaVersion|NpmPkgVersionInfo|NpmPkgDistInfo|NpmUrlLib|NpmUrlPkgLib|JsrClientLib|JsrServerLib|JsrIsLib|JsrImportLib|JsrFetchLib|JsrFetchPkgLib|JsrFetchPkgOptions|JsrFetchPkgChecksumOptions|JsrFetchPkgVersionsResponse|JsrFetchPkgInfoResponse|JsrFetchPkgFileResponse|JsrPkgMetaVersions|JsrPkgMetaVersion|JsrPkgVersionInfo|JsrPkgGraph|JsrPkgGraphModule|JsrPkgGraphDependency|JsrPkgManifest|JsrPkgManifestFile|JsrPkgFileFetcher|JsrManifestLib|JsrManifestFetchResponse|JsrManifestFetchSuccess|JsrManifestFetchFail|JsrManifestPullResponse|JsrManifestPullOptions)\\b" /Users/phil/code/org.sys/sys/code/sys/registry/src
```

Expected residue after implementation:

- none for removed flat alias names in `code/sys/registry/src`.

## Final reality

Landed implementation commit:

- `045386d6d refactor(registry): align npm and jsr type surfaces with namespace spine`

Actual changes:

- Converted npm registry type spines to namespace-first contracts: `NpmClient.Lib`, `NpmServer.Lib`, `NpmIs.Lib`, `NpmImport.Lib`, `NpmFetch.Pkg.*`, and `NpmFetch.Url.*`.
- Converted JSR registry type spines to namespace-first contracts: `JsrClient.Lib`, `JsrServer.Lib`, `JsrIs.Lib`, `JsrImport.Lib`, `JsrFetch.Pkg.*`, and `JsrManifest.*`.
- Updated `code/sys/registry/src/t.ts` aggregation to nested `Registry.Npm.*` and `Registry.Jsr.*` mappings over the canonical namespace members.
- Migrated in-repo registry callers from legacy flat aliases to canonical namespace names.
- Removed the legacy flat alias declarations and stale alias-only labels/comments.
- Preserved runtime exports, package exports, URL formatting, fetch behavior, manifest pull/write behavior, and error semantics.
- Formatter touched additional in-scope npm/jsr tests/helpers only for formatting; no test behavior changes were made.

Final verification:

```sh
git diff --check
cd /Users/phil/code/org.sys/sys/code/sys/registry && deno fmt --check ./src/m.npm ./src/m.jsr ./src/t.ts
cd /Users/phil/code/org.sys/sys/code/sys/registry && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/registry && deno task test
rg -n "\\b(NpmClientLib|NpmServerLib|NpmIsLib|NpmImportLib|NpmFetchLib|NpmFetchPkgLib|NpmFetchPkgOptions|NpmFetchPkgVersionsResponse|NpmFetchPkgInfoResponse|NpmPkgMetaVersions|NpmPkgMetaVersion|NpmPkgVersionInfo|NpmPkgDistInfo|NpmUrlLib|NpmUrlPkgLib|JsrClientLib|JsrServerLib|JsrIsLib|JsrImportLib|JsrFetchLib|JsrFetchPkgLib|JsrFetchPkgOptions|JsrFetchPkgChecksumOptions|JsrFetchPkgVersionsResponse|JsrFetchPkgInfoResponse|JsrFetchPkgFileResponse|JsrPkgMetaVersions|JsrPkgMetaVersion|JsrPkgVersionInfo|JsrPkgGraph|JsrPkgGraphModule|JsrPkgGraphDependency|JsrPkgManifest|JsrPkgManifestFile|JsrPkgFileFetcher|JsrManifestLib|JsrManifestFetchResponse|JsrManifestFetchSuccess|JsrManifestFetchFail|JsrManifestPullResponse|JsrManifestPullOptions)\\b" /Users/phil/code/org.sys/sys/code/sys/registry/src
```

Final review result:

- SHIP.
- Remaining risk: none found.
