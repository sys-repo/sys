import { Tmpl } from '@sys/tmpl/fs';
import { type t, Cli, DenoFile, Fs, Str } from '../common.ts';

/**
 * Setup the template:
 */
export const dir = import.meta.dirname;
export default async function setup(e: t.TmplWriteHandlerArgs, options: { name?: string } = {}) {
  const name = options.name ?? (await Cli.Prompt.Input.prompt({ message: 'Component Name:' }));
  const dir = e.dir.target.absolute;
  const denofile = await DenoFile.Path.nearest(dir);
  const pkgDir = denofile ? Fs.dirname(denofile) : undefined;

  const glob = Fs.glob(dir);
  const paths = (await glob.find('**/*.{ts,tsx}', { includeDirs: false })).map((m) => m.path);

  // Update component name(s):
  await Tmpl.File.update(paths, (line) => {
    const res = Str.replaceAll(line.text, 'MyComponent', name);
    if (res.changed) line.modify(res.after);
  });

  if (pkgDir) {
    // Update types files:
    const moduleDir = dir.slice((pkgDir + 'src/').length + 1);
    const typesPath = Fs.join(pkgDir, 'src/types.ts');
    const specsPath = Fs.join(pkgDir, 'src/-test/entry.Specs.ts');

    await Tmpl.File.update(typesPath, (line) => {
      if (line.is.last) {
        const path = Fs.join(moduleDir, 't.ts');
        const text = `export type * from './${path}';`;
        line.modify(text);
      }
    });
  }

  /**
   * TODO 🐷
   * - insert entry/spec (index)
   * - export ../types.ts
   */
}
