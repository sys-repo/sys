import { type t, Cli, DenoFile, Fs, Str, TmplEngine, tmplFilter } from '../common.ts';
import { updateTypesFile } from '../m.mod/.tmpl.ts';

/**
 * Define the template:
 */
export const dir = import.meta.dirname!;
export const tmpl = TmplEngine.makeTmpl(dir).filter(tmplFilter);

/**
 * Setup the template (after copy):
 */
export default async function setup(e: t.TmplWriteHandlerArgs, options: { name?: string } = {}) {
  const name = options.name ?? (await Cli.Prompt.Input.prompt({ message: 'Component Name:' }));

  const dir = e.dir.target.absolute;
  const denofile = await DenoFile.Path.nearest(dir);
  const pkgDir = denofile ? Fs.dirname(denofile) : undefined;

  const glob = Fs.glob(dir);
  const paths = (await glob.find('**/*.{ts,tsx}', { includeDirs: false })).map((m) => m.path);

  // Update component name(s):
  await TmplEngine.File.update(paths, (line) => {
    const res = Str.replaceAll(line.text, 'MyComponent', name);
    if (res.changed) line.modify(res.after);
  });

  // Update pointer refs:
  if (pkgDir) {
    await updateTypesFile(dir);

    // Update dev-harness spec entry:
    await TmplEngine.File.update(Fs.join(pkgDir, 'src/-test/-specs.ts'), (line) => {
      const index = line.file.lines.findIndex((line) => line.includes('[`${ns}:'));
      if (line.index === index) {
        const moduleDir = dir.slice((pkgDir + 'src/').length + 1);
        const name = moduleDir.replace(/^ui\//, '');
        const text = `  [\`\${ns}: ${name}\`]: () => import('../${moduleDir}/-spec/-SPEC.tsx'),`;
        line.insert(text);
      }

      // NB: sample stub, no longer necessary to leave around.
      if (line.text.includes('// [`${ns}: name`]:')) {
        line.delete();
      }
    });
  }
}
