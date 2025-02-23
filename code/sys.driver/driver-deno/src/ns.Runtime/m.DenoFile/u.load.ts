import { type t, Fs, Path } from './common.ts';

/**
 * Load a `deno.json` file at the given file path.
 */
export const load: t.DenoFileLib['load'] = async (path) => {
  path = Path.resolve(path ?? './deno.json');
  if (await Fs.Is.dir(path)) path = Fs.join(path, 'deno.json');
  return Fs.readJson<t.DenoFileJson>(path);
};
