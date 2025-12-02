import { type t, Is, getConfig } from './common.ts';

export async function normalize(input: t.ServeTool.Config | t.StringDir) {
  const config = Is.string(input) ? await getConfig(input) : input;

  /** Save if changed */
  if (config.fs.pending) await config.fs.save();
}
