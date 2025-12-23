import { type t, D, Fs, JsonFile, Config as Base } from './common.ts';

/**
 * Config file helpers.
 */
export const Config = {
  ...Base,
  get,
  normalize,
} as const;

/**
 * Get or create the `-<name>.config.json` file.
 */
async function get(cwd: t.StringDir): Promise<t.DeployTool.Config.File> {
  const { filename, doc } = D.Config;
  return Base.get<t.DeployTool.Config.Doc>(cwd, filename, doc);
}

/**
 * Perform migrations and other maintenance on the config-file data structure.
 */
export async function normalize(config: t.DeployTool.Config.File) {
  /** Save if changed */
  if (config.fs.pending) await config.fs.save();
}
