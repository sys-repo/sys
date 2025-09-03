import { type t, DenoFile, Err, Fs, TmplEngine } from '../common.ts';

/**
 * Define the template:
 */

/**
 * Setup the template (after copy):
 */
export default async function setup(dir: t.StringAbsoluteDir) {
  await updateTypesFile(dir);
}

/**
 * Updates the root `types.ts` file to include a reference to
 * the given path.
 */
export async function updateTypesFile(dir: t.StringAbsoluteDir) {
  type T = { error?: t.StdError };

  const done = (err?: string): T => {
    const error = err ? Err.std(err) : undefined;
    if (error) console.warn(error);
    return { error };
  };

  const denofile = await DenoFile.Path.nearest(dir);
  const pkgDir = denofile ? Fs.dirname(denofile) : undefined;
  if (!pkgDir) return done(`Failed to find containing package (deno.json) for module at: ${dir}`);

  await TmplEngine.File.update(Fs.join(pkgDir, 'src/types.ts'), (line) => {
    if (line.is.last) {
      const moduleDir = dir.slice((pkgDir + 'src/').length + 1);
      const path = Fs.join(moduleDir, 't.ts');
      line.modify(`export type * from './${path}';`);
    }
  });

  return done();
}
