import type { t } from '../common.ts';
export type * from './t.Workspace.ts';

/**
 * Library: `deno.json` file tools.
 */
export type DenoFileLib = {
  /**
   * Load a `deno.json` file at the given file path.
   */
  load(path?: t.DenoFilePath): Promise<t.DenoFileLoadResult>;

  /**
   * Load a deno workspace.
   */
  workspace(src?: t.StringPath, options?: { walkup?: boolean }): Promise<t.DenoWorkspace>;

  /**
   * Determine if the given input is a `deno.json` file
   * that contains a "workspace":[] configuration.
   */
  isWorkspace(src?: t.StringPath): Promise<boolean>;
};

/** The async response from a `deno.json` file load request. */
export type DenoFileLoadResult = t.FsReadResult<t.DenoFileJson>;

/**
 * A file-path to a `deno.json` file.
 */
export type DenoFilePath = t.StringPath;

/**
 * A parsed `deno.json` file.
 */
export type DenoFileJson = {
  name?: string;
  version?: string;
  licence?: string;
  tasks?: Record<string, string>;
  importMap?: t.StringPath;
  imports?: Record<string, t.StringModuleSpecifier>;
  exports?: Record<string, string>;
  workspace?: t.StringPath[];
};

/**
 * A JSON file containing an import-map.
 * Referenced by `importMap` path in `deno.json` file.
 */
export type DenoImportMapJson = {
  imports?: Record<string, t.StringModuleSpecifier>;
};
