import { type t, Config as Base, D } from './common.ts';
import { normalize } from './u.config.normalize.ts';

/**
 * Get or create the `-<name>.config.json` file.
 */
export async function get(cwd: t.StringDir): Promise<t.ServeTool.Config.File> {
  const { filename, doc } = D.Config;
  const config = await Base.get<t.ServeTool.Config.Doc>(cwd, filename, doc);
  await normalize(cwd, config);
  return config;
}
