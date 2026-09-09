import type { t } from '../common.ts';

/**
 * Library: `deno.json` / `deno.jsonc` file tools.
 */
export declare namespace DenoFile {
  /** Runtime surface for `deno.json` / `deno.jsonc` file tools. */
  export type Lib = {
    /** Helpers for wrangling `deno.json` file paths. */
    readonly Path: Path.Lib;

    /** Boolean evaluators for `deno.json` files. */
    readonly Is: Is.Lib;

    /** Load a `deno.json` / `deno.jsonc` file at the given file path. */
    load(path?: FilePath): Promise<LoadResult>;

    /** Load a deno workspace. */
    workspace(src?: t.StringPath, options?: Workspace.Options): Promise<Workspace.Info>;

    /** Resolve the current version for a package within a Deno workspace. */
    workspaceVersion(
      name: t.StringPkgName,
      src?: t.StringPath,
      options?: Workspace.Options,
    ): Promise<t.StringSemver | undefined>;

    /** Walk up from the starting path looking for the nearest ancestor `deno.json` / `deno.jsonc` file. */
    nearest(start: t.StringPath, shouldStop?: Path.NearestStop): Promise<NearestResult | undefined>;
  };

  /** A file-path to a `deno.json` or `deno.jsonc` file. */
  export type FilePath = t.StringPath;

  /** The async response from a `deno.json` file load request. */
  export type LoadResult = t.Fs.ReadResult<Json>;

  /** Result from the `DenoFile.nearest` method. */
  export type NearestResult = {
    /** Resolved `deno.json` file path. */
    readonly path: t.StringPath;
    /** Directory containing the resolved `deno.json` file. */
    readonly dir: t.StringDir;
    /** Parsed `deno.json` contents. */
    readonly file: Json;
    /** Derived booleans about the resolved file. */
    readonly is: { readonly workspace: boolean };
  };

  /** A parsed `deno.json` file. */
  export type Json = {
    /** Package name, when declared. */
    name?: string;
    /** Package version, when declared. */
    version?: string;
    /** Package license identifier, when declared. */
    license?: string;
    /** Task commands declared in `deno.json`. */
    tasks?: Record<string, string>;
    /** Path to an external import-map file. */
    importMap?: t.StringPath;
    /** Inline import map entries. */
    imports?: Record<string, t.StringModuleSpecifier>;
    /** Export map entries. */
    exports?: Record<string, string>;
    /** Workspace child globs or paths. */
    workspace?: t.StringPath[];
  };

  /**
   * Helpers for wrangling `deno.json` file paths.
   */
  export namespace Path {
    /** Runtime surface for `deno.json` file path helpers. */
    export type Lib = {
      /** Walk up from the starting path looking for the nearest ancestor `deno.json` file. */
      nearest(
        start: t.StringPath,
        shouldStop?: NearestStop,
      ): Promise<t.StringAbsolutePath | undefined>;
    };

    /** Callback used to keep traversing up the ancestor hierarchy looking for a specific `deno.json` file. */
    export type NearestStop = (e: NearestStopArgs) => boolean | Promise<boolean>;

    /** Arguments passed to the nearest-file stop callback. */
    export type NearestStopArgs = {
      /** Absolute path of the candidate `deno.json` file. */
      readonly path: t.StringAbsolutePath;
      /** Parsed contents of the candidate `deno.json` file. */
      readonly file: Json;
    };
  }

  /**
   * Boolean evaluators for `deno.json` files.
   */
  export namespace Is {
    /** Runtime surface for `deno.json` boolean evaluators. */
    export type Lib = {
      /** Determine if the given input is a `deno.json` file that contains a "workspace":[] configuration. */
      workspace(src?: t.StringPath): Promise<boolean>;
    };
  }

  /**
   * Types for working with a Deno workspace.
   */
  export namespace Workspace {
    /** Options for workspace resolution. */
    export type Options = { walkup?: boolean };

    /** An info object for working with a Deno workspace. */
    export type Info = {
      /** Whether the resolved file declared a workspace. */
      readonly exists: boolean;
      /** Workspace root directory. */
      readonly dir: t.StringPath;
      /** Workspace `deno.json` file path. */
      readonly file: t.StringPath;
      /** Loaded child workspace entries. */
      readonly children: Child[];
      /** JSR module specifiers derived from named child packages. */
      readonly modules: t.EsmModules;
    };

    /** Represents a single child of a workspace. */
    export type Child = {
      /** Relative child paths within the workspace. */
      readonly path: { readonly dir: t.StringDir; readonly denofile: t.StringPath };
      /** Parsed child `deno.json` contents. */
      readonly denofile: Json;
      /** Derived package identity for the child. */
      readonly pkg: t.Pkg;
    };
  }

  /**
   * Import-map types referenced by `deno.json` files.
   */
  export namespace ImportMap {
    /** A JSON file containing an import-map referenced by `importMap` in `deno.json`. */
    export type Json = {
      /** Import map entries. */
      imports?: Record<string, t.StringModuleSpecifier>;
    };
  }
}
