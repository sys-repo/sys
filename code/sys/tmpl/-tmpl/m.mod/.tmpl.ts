import { type t, DenoFile, Err, Fs, Tmpl, tmplFilter } from '../common.ts';

/**
 * Define the template:
 */
export const dir = import.meta.dirname!;
export const tmpl = Tmpl.from(dir).filter(tmplFilter);

/**
 * Setup the template (after copy):
 */
export default async function setup(e: t.TmplWriteHandlerArgs) {
  await updateTypesFile(e.dir.target.absolute);
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

  await Tmpl.File.update(Fs.join(pkgDir, 'src/types.ts'), (line) => {
    if (line.is.last) {
      const moduleDir = dir.slice((pkgDir + 'src/').length + 1);
      const path = Fs.join(moduleDir, 't.ts');
      line.modify(`export type * from './${path}';`);
    }
  });

  return done();
}
