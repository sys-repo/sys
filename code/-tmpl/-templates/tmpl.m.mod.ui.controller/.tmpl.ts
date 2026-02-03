import { type t, Cli, DenoFile, Fs, Str, TmplEngine } from '../common.ts';
import { updatePointerRefs } from '../tmpl.m.mod.ui/.tmpl.ts';

/**
 * Setup the template (after copy):
 */
export default async function setup(dir: t.StringAbsoluteDir, options: { name?: string } = {}) {
  const name = options.name ?? (await Cli.Input.Text.prompt({ message: 'Component Name:' }));

  const denofile = await DenoFile.Path.nearest(dir);
  const pkgDir = denofile ? Fs.dirname(denofile) : undefined;

  const glob = Fs.glob(dir);
  const paths = (await glob.find('**/*.{ts,tsx}', { includeDirs: false })).map((m) => m.path);

  // Update component name(s):
  await TmplEngine.File.update(paths, (line) => {
    const res = Str.replaceAll(line.text, 'MyCtrl', name);
    if (res.changed) line.modify(res.after);
  });

  // Update pointer refs:
  if (pkgDir) {
    await updatePointerRefs(dir, pkgDir);
  }
}
