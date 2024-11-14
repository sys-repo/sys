import { exists } from '@std/fs/exists';
import { type t, Fs, Tmpl } from './common.ts';

type F = t.VitePressEnvLib['init'];

export const init: F = async (args = {}) => {
  const { inDir = '', force = false } = args;
  await ensureFiles(inDir, { force });
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
    if (!force) {
      if (await wrangle.existsAndNotEmpty(target)) return;
    }
    await Fs.ensureDir(Fs.dirname(target));
    await Deno.writeTextFile(target, tmpl);
  };

  await ensure(Tmpl.Script.main, '.scripts/-main.ts');
  await ensure(Tmpl.Script.upgrade, '.scripts/-upgrade.ts');
  await ensure(Tmpl.VSCode.settings, '.vscode/settings.json');
  await ensure(Tmpl.Typescript.config, '.vitepress/config.ts');
  await ensure(Tmpl.gitignore, '.vitepress/.gitignore');

  await ensure(Tmpl.Pkg.deno, 'deno.json');
  await ensure(Tmpl.Pkg.package, 'package.json');
  await ensure(Tmpl.Typescript.pkg, 'pkg.ts');

  await ensure(Tmpl.Markdown.index, 'docs/index.md');
}

/**
 * Helpers
 */
const wrangle = {
  async existsAndNotEmpty(target: t.StringPath) {
    const exists = await Fs.exists(target);
    if (exists) {
      const isEmpty = !(await Deno.readTextFile(Fs.resolve(target)));
      if (isEmpty) return false;
    }
    return exists;
  },
} as const;
