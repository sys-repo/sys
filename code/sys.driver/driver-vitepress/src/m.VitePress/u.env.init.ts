import { type t, Fs, Tmpl } from './common.ts';

type F = t.VitePressEnvLib['init'];

export const init: F = async (args = {}) => {
  const { inDir = '' } = args;
  await ensureFiles(inDir);
};

/**
 * Ensure the required configuration files exist within
 * the given directory.
 */
async function ensureFiles(dir: t.StringDir, options: { force?: boolean } = {}) {
  const { force = false } = options;
  dir = Fs.resolve(dir);

  const ensure = async (tmpl: string, target: t.StringPath) => {
    target = Fs.join(dir, target);
    if (!force && (await Fs.exists(target))) return;
    await Fs.ensureDir(Fs.dirname(target));
    await Deno.writeTextFile(target, tmpl);
  };

  await ensure(Tmpl.Scripts.main, '-scripts/-main.ts');
  await ensure(Tmpl.gitignore, '.vitepress/.gitignore');
  await ensure(Tmpl.config, '.vitepress/config.ts');
  await ensure(Tmpl.denofile, 'deno.json');
  await ensure(Tmpl.pkg, 'pkg.ts');
  await ensure(Tmpl.Markdown.index, 'index.md');
}
