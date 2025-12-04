import { type t } from './common.ts';

export async function normalize(config: t.ServeTool.Config) {
  const current = config.current;

  /** Save if changed */
  if (config.fs.pending) await config.fs.save();
}
