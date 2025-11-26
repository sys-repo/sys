import { type t, Is, getConfig } from './common.ts';

export { getConfig };

export async function normalize(input: t.__NAME__Config | t.StringDir) {
  const config = Is.string(input) ? await getConfig(input) : input;

  /** Save if changed */
  if (config.fs.pending) await config.fs.save();
}
