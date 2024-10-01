import { Fs, type t } from '../common.ts';

/**
 * `deno.json` file tools.
 */
export const Denofile: t.DenofileLib = {
  /**
   * Load a `deno.json` file at the given file path.
   */
  load(path) {
    return Fs.readJson<t.DenofileJson>(path);
  },
};
