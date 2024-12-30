import { type t, Err, Fs, Path } from './common.ts';
import { Data } from './m.Data.ts';

/**
 * Save a file-bundle to a target location.
 */
export const write: t.FileMapLib['write'] = async (target, bundle) => {
  const errors = Err.errors();
  target = Path.resolve(target);
  await Fs.ensureDir(target);

  // Copy files.
  const wait = Object.entries(bundle).map(async ([key, value]) => {
    const path = Path.join(target, key);
    try {
      await Fs.write(path, Data.decode(value));
    } catch (cause: any) {
      errors.push(`Failed while writing FileMap path: ${path}`, cause);
    }
  });
  await Promise.all(wait);

  // Finish up.
  const error = errors.toError();
  return { target, error };
};
