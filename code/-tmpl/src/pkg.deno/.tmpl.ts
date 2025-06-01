import { type t, Cli, DenoFile, Fs, Str, Tmpl, tmplFilter } from '../common.ts';

/**
 * Define the template:
 */
export const dir = import.meta.dirname!;
export const tmpl = Tmpl.create(dir, (e) => {
  if (e.target.file.name === '-deno.json') e.rename('deno.json');
}).filter(tmplFilter);

/**
 * Setup the template:
 */
export default async function setup(e: t.TmplWriteHandlerArgs, options: { pkgName?: string } = {}) {
  const pkgName = options.pkgName ?? (await Cli.Prompt.Input.prompt({ message: '@sample/foo:' }));

  const dir = e.dir.target.absolute;
  const monorepo = await DenoFile.nearest(dir, (e) => Array.isArray(e.file.workspace));
  if (!monorepo) throw new Error(`Failed to find the host monorepo.`);
  const pkgDir = dir.slice(monorepo.dir.length + 1);

  const glob = Fs.glob(dir);
  const paths = (await glob.find('**', { includeDirs: false })).map((m) => m.path);

  /**
   * Update files within template:
   */
  await Tmpl.File.update(paths, (line) => {
    if (line.text.includes('@sample/foo')) {
      const text = Str.replaceAll(line.text, '@sample/foo', pkgName).after;
      line.modify(text);
    }
  });

  /**
   * Update monorepo environment:
   */
  await Tmpl.File.update(Fs.join(monorepo.dir, '-scripts/u.paths.ts'), (line) => {
    if (line.text.includes('modules: [')) {
      line.insert(`    '${pkgDir}',\n`, 'after');
    }
  });

  await Tmpl.File.update(monorepo.path, (line) => {
    if (line.text.includes('"workspace": [')) {
      line.insert(`    "${pkgDir}",\n`, 'after');
    }
  });
}
