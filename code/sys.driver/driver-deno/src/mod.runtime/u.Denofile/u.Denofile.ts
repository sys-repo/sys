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

  /**
   * Load a deno workspace.
   */
  async workspace(source) {
    const { exists, json } = await wrangle.json(source);
    const paths = json?.workspace ?? [];
    return { exists, paths };
  },
};

/**
 * Helpers
 */
const wrangle = {
  async json(source: t.StringPath | t.DenofileJson) {
    if (typeof source === 'object') return { exists: true, json: source };
    const { exists, json } = await Denofile.load(source);
    return { exists, json };
  },
} as const;
