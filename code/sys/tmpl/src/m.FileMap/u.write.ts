import { type t, Err, Fs, Path } from './common.ts';
import { Data } from './m.Data.ts';

/**
 * Save a file-bundle to a target location.
 */
export const write: t.FileMapLib['write'] = async (dir, bundle) => {
  const errors = Err.errors();
  dir = Path.resolve(dir);
  await Fs.ensureDir(dir);

  // Copy files.
  const wait = Object.entries(bundle).map(async ([key, value]) => {
    const path = Path.join(dir, key);
    try {
      await Fs.ensureDir(Path.dirname(path));
      await writeFile(path, Data.decode(value));
    } catch (err: any) {
      errors.push(`Failed while writing FileMap path: ${path}`, err);
    }
  });
  await Promise.all(wait);

  // Finish up.
  const err = errors.toError();
  return { err };
};

/**
 * Helpers
 */
async function writeFile(path: t.StringPath, data: string | Uint8Array) {
  if (typeof data === 'string') {
    await Deno.writeTextFile(path, data);
  } else {
    await Deno.writeFile(path, data);
  }
}
