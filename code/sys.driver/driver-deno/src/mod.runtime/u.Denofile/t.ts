import type { t } from '../common.ts';

type SrcInput = t.StringPath | t.DenofileJson;

/**
 * Library: `deno.json` file tools.
 */
export type DenofileLib = {
  /**
   * Load a `deno.json` file at the given file path.
   */
  load(path?: t.DenofilePath): Promise<t.FsReadJsonResponse<t.DenofileJson>>;

  /**
   * Load a deno workspace.
   */
  workspace(src?: SrcInput, options?: { walkup?: boolean }): Promise<t.DenoWorkspace>;

  /**
   * Determine if the given input is a `deno.json` file
   * that contains a "workspace":[] configuration.
   */
  isWorkspace(src?: SrcInput): Promise<boolean>;
};

/**
 * A file-path to a `deno.json` file.
 */
export type DenofilePath = t.StringPath;

/**
 * A parsed `deno.json` file.
 */
export type DenofileJson = {
  name?: string;
  version?: string;
  licence?: string;
  tasks?: Record<string, string>;
  importMap?: t.StringPath;
  exports?: Record<string, string>;
  workspace?: t.StringPath[];
};

/**
 * An <Info> object for working with a Deno workspace.
 */
export type DenoWorkspace = {
  readonly exists: boolean;
  readonly paths: t.StringPath[];
};
