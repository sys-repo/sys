import type { t } from '../common.ts';

/**
 * Library: `deno.json` file tools.
 */
export type DenofileLib = {
  /**
   * Load a `deno.json` file at the given file path.
   */
  load(path?: t.StringPath): Promise<t.ReadJsonResponse<t.DenofileJson>>;

  /**
   * Load a deno workspace.
   */
  workspace(source?: t.StringPath | t.DenofileJson): Promise<t.DenoWorkspace>;
};

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
