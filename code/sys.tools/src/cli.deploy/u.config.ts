import { type t, D, Fs, Is, JsonFile, Config as Base } from './common.ts';

/**
 * Config file helpers.
 */
export const Config = {
  ...Base,
  normalize,
  get: getConfig,
} as const;

/**
 * Get or create the `-<name>.config.json` file.
 */
export async function getConfig(dir: t.StringDir): Promise<t.DeployTool.Config> {
  const path = Fs.join(dir, D.Config.filename);
  const doc = JsonFile.Singleton.get<t.DeployTool.ConfigDoc>(path, D.Config.doc, { touch: true });
  return doc;
}

/**
 * Perform migrations and other maintenance on the config-file data structure.
 */
export async function normalize(config: t.DeployTool.Config) {
  /** Save if changed */
  if (config.fs.pending) await config.fs.save();
}
