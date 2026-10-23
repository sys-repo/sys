import { type t } from '../common.ts';

/** Rename a file or directory without copy/delete fallback semantics. */
export const rename: t.Fs.Rename = async (from, to) => {
  await Deno.rename(from, to);
};
