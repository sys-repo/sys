import { type t, Cli, DenoFile, Fs, Str, TmplEngine } from '../common.ts';

/**
 * Setup the template (after copy):
 */
export default async function setup(dir: t.StringAbsoluteDir, options: { pkgName?: string } = {}) {
  const pkgName = options.pkgName ?? (await Cli.Prompt.Input.prompt({ message: '@scope/name:' }));
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
  await TmplEngine.File.update(paths, (line) => {
    if (line.text.includes('@sample/foo')) {
      const text = Str.replaceAll(line.text, '@sample/foo', pkgName).after;
      line.modify(text);
    }
  });

  /**
   * Update monorepo environment:
   */
  const pkgDir = dir.slice(monorepo.dir.length + 1);
  await TmplEngine.File.update(Fs.join(monorepo.dir, '-scripts/-PATHS.ts'), (line) => {
    if (line.text.includes('modules: [')) {
      line.insert(`    '${pkgDir}',\n`, 'after');
    }
  });

  await TmplEngine.File.update(monorepo.path, (line) => {
    if (line.text.includes('"workspace": [')) {
      line.insert(`    "${pkgDir}",\n`, 'after');
    }
  });
}
