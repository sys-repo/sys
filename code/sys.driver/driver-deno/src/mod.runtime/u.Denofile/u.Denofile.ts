import { Fs, type t } from '../common.ts';

/**
 * `deno.json` file tools.
 */
export const Denofile: t.DenofileLib = {
  /**
   * Load a `deno.json` file at the given file path.
   */
  load(path) {
    return Fs.readJson<t.DenofileJson>(path ?? Fs.resolve('./deno.json'));
  },

  /**
   * Load a deno workspace.
   */
  async workspace(source) {
    const file = await wrangle.json(source);
    const exists = file.exists && Array.isArray(file.json?.workspace);
    const paths = file.json?.workspace ?? [];
    return { exists, paths };
  },
};

/**
 * Helpers
 */
const wrangle = {
  json(source?: t.StringPath | t.DenofileJson) {
    if (typeof source === 'object') return { exists: true, json: source };
    return Denofile.load(source);
  },
} as const;
