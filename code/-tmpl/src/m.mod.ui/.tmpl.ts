import { type t, Cli, DenoFile, Fs, Str, Tmpl, tmplFilter } from '../common.ts';

/**
 * Define the template:
 */
export const dir = import.meta.dirname!;
export const tmpl = Tmpl.create(dir).filter(tmplFilter);

/**
 * Setup the template:
 */
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

  // Update pointer refs:
  if (pkgDir) {
    const moduleDir = dir.slice((pkgDir + 'src/').length + 1);

    // Update `types` file reference:
    await Tmpl.File.update(Fs.join(pkgDir, 'src/types.ts'), (line) => {
      if (line.is.last) {
        const path = Fs.join(moduleDir, 't.ts');
        line.modify(`export type * from './${path}';`);
      }
    });

    // Update dev-harness spec entry:
    await Tmpl.File.update(Fs.join(pkgDir, 'src/-test/entry.Specs.ts'), (line) => {
      const index = line.file.lines.findIndex((line) => line.includes('[`${ns}:'));
      if (line.index === index) {
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
