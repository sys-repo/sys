import { type t, Fs, Tmpl } from './common.ts';

type F = t.VitePressEnvLib['init'];

export const init: F = async (args = {}) => {
  const { inDir = '', srcDir, force = false } = args;
  await ensureFiles({ inDir, srcDir, force });
};

/**
 * Ensure the required configuration files exist within
 * the given directory.
 */
async function ensureFiles(args: { inDir: t.StringDir; srcDir?: t.StringDir; force?: boolean }) {
  const { force = false, srcDir } = args;

  const ensure = async (tmpl: string, target: t.StringPath) => {
    target = Fs.join(args.inDir, target);
    if (!force) {
      if (await wrangle.existsAndNotEmpty(target)) return;
    }
    await Fs.ensureDir(Fs.dirname(target));
    await Deno.writeTextFile(target, tmpl);
  };

  await ensure(Tmpl.Script.main, '.scripts/-main.ts');
  await ensure(Tmpl.VSCode.settings, '.vscode/settings.json');
  await ensure(Tmpl.Typescript.config({ srcDir }), '.vitepress/config.ts');
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
