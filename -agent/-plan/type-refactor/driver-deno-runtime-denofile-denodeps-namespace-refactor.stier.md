# @sys/driver-deno runtime DenoFile + DenoDeps namespace refactor

- [x] c31b58301 refactor(driver-deno): namespace Deno runtime type spines

## Scope

Convert these runtime type spines from the legacy flat type surface to the canonical namespace spine:

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/t.ts`
- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/t.ts`

Runtime values remain unchanged:

- `DenoFile` remains the public runtime value for `deno.json` / `deno.jsonc` helpers.
- `DenoDeps` remains the public runtime value for dependency projection/apply helpers.

The comparison anchor is `code/sys.tools/src/m.help/t.ts`, which uses the modern pattern:

```ts
export declare namespace Help {
  export type Lib = {
    readonly Root: Root.Lib;
    readonly Dsl: Dsl.Lib;
  };

  export namespace Root {
    export type Lib = { ... };
  }
}
```

## XHIGH review outcome

Proceed with a clean namespace refactor.

Reject these non-goals:

- Do not move runtime values into `t.ts`, `t.*.ts`, or the type plane.
- Do not widen the public API with compatibility aliases.
- Do not add deprecated alias blocks without exact current caller proof.
- Do not preserve stale flat public exports after all in-scope callers are migrated.

## Current legacy flat names

### DenoFile

Current public flat names:

- `DenoFileLib`
- `DenoFilePath`
- `DenoFilePathLib`
- `DenoFileNearestStop`
- `DenoFileNearestStopArgs`
- `DenoFileNearestResult`
- `DenoFileIsLib`
- `DenoFileLoadResult`
- `DenoFileJson`
- `DenoImportMapJson`
- `DenoWorkspace`
- `DenoWorkspaceChild`

### DenoDeps

Current public flat names:

- `DepsLib`
- `DepTargetFile`
- `DepsResult`
- `Deps`
- `DepsYaml`
- `DepsYamlOptions`
- `DepsCategorizeByGroup`
- `DepsCategorizeByGroupArgs`
- `Dep`
- `DepsFmt`
- `YamlDeps`
- `YamlDepsGroupName`
- `YamlDepsGroups`
- `YamlDepsGroup`
- `YamlDep`

`DenoDeps` already has a partial namespace, but `Lib` is not first because the primary runtime contract is still flat as `DepsLib`.

## Target namespace shape

### DenoFile

```ts
export declare namespace DenoFile {
  export type Lib = {
    readonly Path: Path.Lib;
    readonly Is: Is.Lib;
    load(path?: FilePath): Promise<LoadResult>;
    workspace(src?: t.StringPath, options?: Workspace.Options): Promise<Workspace.Info>;
    workspaceVersion(
      name: t.StringPkgName,
      src?: t.StringPath,
      options?: Workspace.Options,
    ): Promise<t.StringSemver | undefined>;
    nearest(start: t.StringPath, shouldStop?: Path.NearestStop): Promise<NearestResult | undefined>;
  };

  export type FilePath = t.StringPath;
  export type LoadResult = t.Fs.ReadResult<Json>;
  export type NearestResult = { ... };
  export type Json = { ... };

  export namespace Path {
    export type Lib = { ... };
    export type NearestStop = (e: NearestStopArgs) => boolean | Promise<boolean>;
    export type NearestStopArgs = { ... };
  }

  export namespace Is {
    export type Lib = { ... };
  }

  export namespace Workspace {
    export type Options = { walkup?: boolean };
    export type Info = { ... };
    export type Child = { ... };
  }

  export namespace ImportMap {
    export type Json = { ... };
  }
}
```

Notes:

- `Lib` appears first.
- `Workspace.Options` is an input options shape, so do not add `readonly` only for style.
- Preserve the existing field mutability of parsed JSON/YAML shapes unless the implementation work separately proves a safe contract tightening.

### DenoDeps

```ts
export declare namespace DenoDeps {
  export type Lib = {
    readonly Fmt: Fmt.Lib;
    from(input: t.StringPath | t.StringYaml): Promise<LoadResult>;
    toJson(kind: 'deno.json', deps?: Dep[]): t.PkgDenoJson;
    toJson(kind: 'package.json', deps?: Dep[]): t.PkgNodeJson;
    applyDeno(path: t.StringPath | undefined, deps?: Dep[]): Promise<Apply.DenoResult>;
    applyPackage(path: t.StringPath | undefined, deps?: Dep[]): Promise<Apply.PackageResult | undefined>;
    applyYaml(path: t.StringPath | undefined, deps?: Dep[], options?: YamlOptions): Promise<Apply.YamlResult>;
    applyFiles(input: Apply.FilesInput, deps?: Dep[]): Promise<Apply.FilesResult>;
    verifyDeno(input: VerifyDeno.Input): Promise<VerifyDeno.Result>;
    toYaml(deps: Dep[], options?: YamlOptions): Yaml;
    toDep(module: t.EsmImport | t.StringModuleSpecifier, options?: ToDepOptions): Dep;
    findImport(deps: Dep[] | undefined, input: t.StringModuleSpecifier): t.StringModuleSpecifier | undefined;
  };

  export type TargetKind = t.EsmDeps.TargetKind;
  export type TargetFile = t.EsmDeps.TargetFile;
  export type Dep = t.EsmDeps.Entry;
  export type Manifest = { ... };
  export type LoadResult = { data?: Manifest; error?: t.StdError };
  export type Yaml = t.EsmDeps.Yaml;
  export type YamlOptions = { groupBy?: GroupBy };
  export type GroupBy = (e: GroupByArgs) => t.IgnoredResult;
  export type GroupByArgs = { ... };
  export type ToDepOptions = { ... };

  export namespace Apply {
    export type DenoResult = t.EsmDeps.ApplyResult;
    export type PackageResult = t.EsmDeps.ApplyPackageResult;
    export type YamlResult = t.EsmDeps.ApplyYamlResult;
    export type FilesResult = t.EsmDeps.ApplyFilesResult;
    export type FilesInput = { ... };
  }

  export namespace VerifyDeno {
    export type Input = { ... };
    export type Result = { ... };
  }

  export namespace Fmt {
    export type Lib = { ... };
  }

  export namespace YamlFile {
    export type Shape = { ... };
    export type GroupName = string;
    export type Groups = { ... };
    export type Group = Omit<Dep, 'group'>;
    export type Dep = { ... };
  }
}
```

Notes:

- `Manifest` replaces the flat `Deps` name because `DenoDeps.Deps` is redundant and lower signal.
- `Dep` remains as the namespace-local singular dependency entry noun because the runtime method is `toDep` and current docs use dependency/deps language.
- `Apply` owns the related apply result/input shapes.
- `VerifyDeno` owns the verification input/result pair.
- `YamlFile` owns the authored deps YAML source-file shape currently in `t.yaml.ts`.

## Legacy alias disposition

Do not retain top-level compatibility aliases.

Current caller evidence is fully migratable in the same refactor:

- Direct imports:
  - `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/m.DenoFile.ts` imports `DenoFileLib`.
  - `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/m.DenoFile.Is.ts` imports `DenoFileIsLib`.
  - `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/mod.ts` imports `DepsLib`.
- Local `t.*` references:
  - DenoFile internals reference `t.DenoFileLib`, `t.DenoFileJson`, `t.DenoWorkspace`, `t.DenoWorkspaceChild`, and `t.DenoFileNearestStop`.
  - DenoDeps internals reference `t.DepsLib`, `t.Dep`, `t.DepTargetFile`, `t.DepsYamlOptions`, and `t.DepsFmt`.
- Adjacent deploy code references `t.DenoWorkspace` in stage contracts and tests.

No exact current caller requires a compatibility alias.

## Expected source changes

### DenoFile type spine

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/t.ts`
  - Rewrite as `export declare namespace DenoFile`.
  - Put `DenoFile.Lib` first.
  - Inline the path, workspace, import-map, JSON, result, and callback detail contracts under `DenoFile.*`.
  - Remove `export type * from './t.Path.ts'` and `export type * from './t.Workspace.ts'`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/t.Path.ts`
  - Remove as stale after its types move under `DenoFile.Path`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/t.Workspace.ts`
  - Remove as stale after its types move under `DenoFile.Workspace`.

### DenoFile runtime/reference callers

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/m.DenoFile.ts`
  - Replace direct `DenoFileLib` import with local `type t` lane.
  - Type the runtime value as `t.DenoFile.Lib`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/m.DenoFile.Is.ts`
  - Replace direct `DenoFileIsLib` import with local `type t` lane.
  - Type `Is` as `t.DenoFile.Is.Lib`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/m.DenoFile.Path.ts`
  - Update `t.DenoFileLib['Path']` to `t.DenoFile.Lib['Path']` or `t.DenoFile.Path.Lib`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/u.load.ts`
  - Update `t.DenoFileLib['load']` to `t.DenoFile.Lib['load']`.
  - Update `t.DenoFileJson` to `t.DenoFile.Json`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/u.nearest.ts`
  - Update `t.DenoFileLib['nearest']` to `t.DenoFile.Lib['nearest']`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/u.workspace.ts`
  - Update `t.DenoFileLib['workspace']` to `t.DenoFile.Lib['workspace']`.
  - Update `t.DenoWorkspace` to `t.DenoFile.Workspace.Info`.
  - Update `t.DenoWorkspaceChild` to `t.DenoFile.Workspace.Child`.
  - Update `t.DenoFileJson` to `t.DenoFile.Json`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/u.workspaceVersion.ts`
  - Use `t.DenoFile.Workspace.Options` for the options parameter.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoFile/-.test.ts`
  - Update test type references from `t.DenoFileNearestStop` and `t.DenoFileJson` to namespace-qualified names.
  - Update only type references; runtime test assertions remain unchanged.

### DenoDeps type spine

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/t.ts`
  - Rewrite as one `export declare namespace DenoDeps` with `Lib` first.
  - Move all existing flat details under `DenoDeps.*`.
  - Remove `export type * from './t.yaml.ts'`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/t.yaml.ts`
  - Remove as stale after YAML source-file shapes move under `DenoDeps.YamlFile`.

### DenoDeps runtime/reference callers

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/mod.ts`
  - Replace direct `DepsLib` import with local `type t` lane.
  - Type the runtime value as `t.DenoDeps.Lib`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/m.Deps.ts`
  - Update method type references to `t.DenoDeps.Lib[...]`.
  - Update return data shape references to `t.DenoDeps.Manifest`, `t.DenoDeps.LoadResult`, `t.DenoDeps.YamlOptions`, and `t.DenoDeps.Yaml` as needed.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/m.Fmt.ts`
  - Update `t.DepsFmt` to `t.DenoDeps.Fmt.Lib`.
  - Update dependency list references to `t.DenoDeps.Dep[]`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/u.apply.ts`
  - Update `t.DepsLib['applyDeno']`, `t.Dep[]`, and apply result references to `t.DenoDeps.*`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/u.applyFiles.ts`
  - Update `t.DepsLib['applyFiles']`, inline apply-files input, `t.Dep[]`, and `t.DepsYamlOptions` to namespace-qualified names.
  - Prefer `t.DenoDeps.Apply.FilesInput` to duplicated inline input once it exists.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/u.applyPackage.ts`
  - Update `t.DepsLib['applyPackage']`, `t.Dep[]`, and package apply result references.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/u.applyYaml.ts`
  - Update `t.DepsLib['applyYaml']`, `t.Dep[]`, `t.DepsYamlOptions`, and YAML apply result references.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/u.toJson.ts`
  - Update `t.DepTargetFile` to `t.DenoDeps.TargetFile`.
  - Update `t.Dep[]` to `t.DenoDeps.Dep[]`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/u.toJson.deno.ts`
  - Update `t.Dep[]` to `t.DenoDeps.Dep[]`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/u.toJson.package.ts`
  - Update `t.Dep[]` to `t.DenoDeps.Dep[]`.

- `code/sys.driver/driver-deno/src/m.runtime/m.DenoDeps/u.verifyDeno.ts`
  - Update `t.DepsLib['verifyDeno']` to `t.DenoDeps.Lib['verifyDeno']`.
  - Keep runtime behavior unchanged.

### Adjacent package references

- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/t.stage.ts`
  - Update `t.DenoWorkspace` to `t.DenoFile.Workspace.Info`.

- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.stage/u.executeStage.ts`
  - Update local `StageContext.workspace` from `t.DenoWorkspace` to `t.DenoFile.Workspace.Info`.

- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.stage/u.resolveStageTarget.ts`
  - Update local `Response.workspace` from `t.DenoWorkspace` to `t.DenoFile.Workspace.Info`.

- `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.pipeline/-test/-u.prepare.test.ts`
  - Update fixture workspace type from `t.DenoWorkspace` to `t.DenoFile.Workspace.Info`.

### Files expected not to change

- `code/sys.driver/driver-deno/src/types.ts`
  - It should continue to re-export `./m.runtime/m.DenoFile/t.ts` and `./m.runtime/m.DenoDeps/t.ts`.

- `code/sys.driver/driver-deno/src/common/t.ts`
  - The local type pool already imports `../types.ts`; no new lane should be added.

- `code/sys.driver/driver-deno/src/m.runtime/mod.ts`
  - Runtime exports are unchanged.

## Reference migration map

### DenoFile

- `t.DenoFileLib` → `t.DenoFile.Lib`
- `t.DenoFilePath` → `t.DenoFile.FilePath`
- `t.DenoFilePathLib` → `t.DenoFile.Path.Lib`
- `t.DenoFileNearestStop` → `t.DenoFile.Path.NearestStop`
- `t.DenoFileNearestStopArgs` → `t.DenoFile.Path.NearestStopArgs`
- `t.DenoFileNearestResult` → `t.DenoFile.NearestResult`
- `t.DenoFileIsLib` → `t.DenoFile.Is.Lib`
- `t.DenoFileLoadResult` → `t.DenoFile.LoadResult`
- `t.DenoFileJson` → `t.DenoFile.Json`
- `t.DenoImportMapJson` → `t.DenoFile.ImportMap.Json`
- `t.DenoWorkspace` → `t.DenoFile.Workspace.Info`
- `t.DenoWorkspaceChild` → `t.DenoFile.Workspace.Child`

### DenoDeps

- `t.DepsLib` → `t.DenoDeps.Lib`
- `t.DepTargetFile` → `t.DenoDeps.TargetFile`
- `t.Dep` → `t.DenoDeps.Dep`
- `t.DepsResult` → `t.DenoDeps.LoadResult`
- `t.Deps` → `t.DenoDeps.Manifest`
- `t.DepsYaml` → `t.DenoDeps.Yaml`
- `t.DepsYamlOptions` → `t.DenoDeps.YamlOptions`
- `t.DepsCategorizeByGroup` → `t.DenoDeps.GroupBy`
- `t.DepsCategorizeByGroupArgs` → `t.DenoDeps.GroupByArgs`
- `t.DepsFmt` → `t.DenoDeps.Fmt.Lib`
- `t.YamlDeps` → `t.DenoDeps.YamlFile.Shape`
- `t.YamlDepsGroupName` → `t.DenoDeps.YamlFile.GroupName`
- `t.YamlDepsGroups` → `t.DenoDeps.YamlFile.Groups`
- `t.YamlDepsGroup` → `t.DenoDeps.YamlFile.Group`
- `t.YamlDep` → `t.DenoDeps.YamlFile.Dep`
- `t.DenoDeps.ApplyResult` → `t.DenoDeps.Apply.DenoResult`
- `t.DenoDeps.ApplyPackageResult` → `t.DenoDeps.Apply.PackageResult`
- `t.DenoDeps.ApplyYamlResult` → `t.DenoDeps.Apply.YamlResult`
- `t.DenoDeps.ApplyFilesResult` → `t.DenoDeps.Apply.FilesResult`
- `t.DenoDeps.VerifyDenoInput` → `t.DenoDeps.VerifyDeno.Input`
- `t.DenoDeps.VerifyDenoResult` → `t.DenoDeps.VerifyDeno.Result`

## Execution sequence

1. Rewrite `m.DenoFile/t.ts` into the canonical namespace shape with `DenoFile.Lib` first.
2. Remove `m.DenoFile/t.Path.ts` and `m.DenoFile/t.Workspace.ts` after their public contracts are moved into `DenoFile.*`.
3. Migrate DenoFile implementation and test references to `t.DenoFile.*`.
4. Rewrite `m.DenoDeps/t.ts` into the canonical namespace shape with `DenoDeps.Lib` first.
5. Remove `m.DenoDeps/t.yaml.ts` after its public contracts are moved into `DenoDeps.YamlFile.*`.
6. Migrate DenoDeps implementation references to `t.DenoDeps.*`.
7. Migrate adjacent DenoDeploy type references from flat Deno workspace names to `t.DenoFile.Workspace.Info`.
8. Run the verification commands below and do a residue search for removed flat names.

## Residue checks

Use content search only to locate candidate residue, then inspect/edit through the file tools as needed.

Candidate searches:

```bash
rg -n "\b(DenoFileLib|DenoFilePathLib|DenoFileNearestStop|DenoFileNearestResult|DenoFileIsLib|DenoFileLoadResult|DenoFileJson|DenoImportMapJson|DenoWorkspace|DenoWorkspaceChild)\b" /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno/src
rg -n "\b(DepsLib|DepTargetFile|DepsResult|DepsYaml|DepsYamlOptions|DepsCategorizeByGroup|DepsFmt|YamlDeps|YamlDep)\b" /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno/src
```

## Verification commands

Run from the nearest owning Deno module:

```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno && deno task check
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno && deno task test --trace-leaks ./src/m.runtime/m.DenoFile
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno && deno task test --trace-leaks ./src/m.runtime/m.DenoDeps
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno && deno task test --trace-leaks ./src/m.cloud/m.DenoDeploy
```

Final package verification:

```bash
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno && deno task test
```

## Final reality

Landed implementation commit:

- `c31b58301 refactor(driver-deno): namespace Deno runtime type spines`

Actual changes:

- Converted `DenoFile` to `DenoFile.Lib` and nested `DenoFile.Path`, `DenoFile.Is`, `DenoFile.Workspace`, and `DenoFile.ImportMap` type namespaces.
- Converted `DenoDeps` to `DenoDeps.Lib` and nested `DenoDeps.Apply`, `DenoDeps.VerifyDeno`, `DenoDeps.Fmt`, and `DenoDeps.YamlFile` type namespaces.
- Removed stale flat factor files: `m.DenoFile/t.Path.ts`, `m.DenoFile/t.Workspace.ts`, and `m.DenoDeps/t.yaml.ts`.
- Migrated in-scope DenoFile, DenoDeps, and adjacent DenoDeploy type references to the namespace spine.
- No compatibility aliases or deprecated alias blocks were retained or added.

Final verification/proof:

- `deno fmt --check` on all changed source files passed.
- `cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno && deno task check` passed.
- `cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno && deno task test --trace-leaks ./src/m.runtime/m.DenoFile` passed.
- `cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno && deno task test --trace-leaks ./src/m.runtime/m.DenoDeps` passed.
- `cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno && deno task test --trace-leaks ./src/m.cloud/m.DenoDeploy` passed.
- `cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-deno && deno task test` passed.
- Final XHIGH TMIND + S-tier review result: SHIP.

Remaining risk: none found.

## HOLD conditions

Hold before editing or committing if any of these appear:

- A current in-repo caller cannot be migrated away from a flat legacy name in the same refactor.
- A flat alias appears necessary for a concrete current caller; record that exact caller and request approval before adding the alias.
- The namespace rewrite would require changing runtime behavior, emitted JSON/YAML shape, filesystem effects, or Deno process invocation behavior.
- A type-plane file would need runtime values, runtime imports, IO, side effects, or convenience value re-exports.
- Verification reveals external public consumers or generated files that require a separate compatibility-alias/removal decision.
