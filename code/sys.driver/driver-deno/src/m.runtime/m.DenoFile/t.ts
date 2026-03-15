import type { t } from '../common.ts';
export type * from './t.Path.ts';
export type * from './t.Workspace.ts';

/** A file-path to a `deno.json` or `deno.jsonc` file. */
export type DenoFilePath = t.StringPath;

/**
 * Library: `deno.json` / `deno.jsonc` file tools.
 */
export type DenoFileLib = {
  /** Helpers for wrangling `deno.json` file paths. */
  readonly Path: t.DenoFilePathLib;

  /** Boolean evaluators for `deno.json` files. */
  readonly Is: t.DenoFileIsLib;

  /**
   * Load a `deno.json` / `deno.jsonc` file at the given file path.
   */
  load(path?: t.DenoFilePath): Promise<t.DenoFileLoadResult>;

  /**
   * Load a deno workspace.
   */
  workspace(src?: t.StringPath, options?: { walkup?: boolean }): Promise<t.DenoWorkspace>;

  /**
   * Resolve the current version for a package within a Deno workspace.
   */
  workspaceVersion(name: t.StringPkgName, src?: t.StringPath, options?: { walkup?: boolean }): Promise<t.StringSemver | undefined>;

  /**
   * Walks up from the starting path looking for the nearest
   * ancestor `deno.json` / `deno.jsonc` file.
   */
  nearest(
    start: t.StringPath,
    shouldStop?: t.DenoFileNearestStop,
  ): Promise<t.DenoFileNearestResult | undefined>;
};

/** Result from the `DenoFile.nearest` method. */
export type DenoFileNearestResult = {
  /** Resolved `deno.json` file path. */
  readonly path: t.StringPath;
  /** Directory containing the resolved `deno.json` file. */
  readonly dir: t.StringDir;
  /** Parsed `deno.json` contents. */
  readonly file: t.DenoFileJson;
  /** Derived booleans about the resolved file. */
  readonly is: { readonly workspace: boolean };
};

/**
 * Boolean evaluators for `deno.json` files.
 */
export type DenoFileIsLib = {
  /**
   * Determine if the given input is a `deno.json` file
   * that contains a "workspace":[] configuration.
   */
  workspace(src?: t.StringPath): Promise<boolean>;
};

/** The async response from a `deno.json` file load request. */
export type DenoFileLoadResult = t.Fs.ReadResult<t.DenoFileJson>;

/**
 * A parsed `deno.json` file.
 */
export type DenoFileJson = {
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
 * A JSON file containing an import-map.
 * Referenced by `importMap` path in `deno.json` file.
 */
export type DenoImportMapJson = {
  /** Import map entries. */
  imports?: Record<string, t.StringModuleSpecifier>;
};
