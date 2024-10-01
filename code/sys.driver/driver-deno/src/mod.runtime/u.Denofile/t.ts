import type { t } from '../common.ts';

/**
 * Library: `deno.json` file tools.
 */
export type DenofileLib = {
  /**
   * Load a `deno.json` file at the given file path.
   */
  load(path: t.StringPath): Promise<t.ReadJsonResponse<t.DenofileJson>>;
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
