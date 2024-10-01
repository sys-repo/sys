import type { t } from '../common.ts';

/**
 * A parsed `deno.json` file.
 */
export type DenofileJson = {
  tasks?: Record<string, string>;
  workspace?: t.StringPath[];
  importMap?: t.StringPath;
  exports?: Record<string, string>;
};
