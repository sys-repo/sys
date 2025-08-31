import { type t, Cli, DenoFile, Fs, Str, Tmpl, tmplFilter } from '../common.ts';

/**
 * Define the template:
 */
export const dir = import.meta.dirname!;
export const tmpl = Tmpl.from(dir).filter(tmplFilter);

/**
 * Setup the template (after copy):
 */
export default async function setup(e: t.TmplWriteHandlerArgs, options: { pkgName?: string } = {}) {
  const pkgName = options.pkgName ?? (await Cli.Prompt.Input.prompt({ message: '@scope/name:' }));

  const dir = e.dir.target.absolute;
  const monorepo = await DenoFile.nearest(dir, (e) => Array.isArray(e.file.workspace));
  if (!monorepo) throw new Error(`Failed to find the host monorepo.`);

  /**
   * Clean up filenames:
   */
  await Fs.move(Fs.join(dir, '-deno.json'), Fs.join(dir, 'deno.json'));

  /**
   * Update files within template:
   */
  const glob = Fs.glob(dir);
  const paths = (await glob.find('**', { includeDirs: false })).map((m) => m.path);
  await Tmpl.File.update(paths, (line) => {
    if (line.text.includes('@sample/foo')) {
      const text = Str.replaceAll(line.text, '@sample/foo', pkgName).after;
      line.modify(text);
    }
  });

  /**
   * Update monorepo environment:
   */
  const pkgDir = dir.slice(monorepo.dir.length + 1);
  await Tmpl.File.update(Fs.join(monorepo.dir, '-scripts/-PATHS.ts'), (line) => {
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
