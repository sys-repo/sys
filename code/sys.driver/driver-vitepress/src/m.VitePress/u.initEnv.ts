import { type t, pkg, Cli, Fs, Tmpl, c } from './common.ts';

type F = t.VitePressEnvLib['init'];

export const init: F = async (args = {}) => {
  const { inDir = '', srcDir, force = false, silent = false } = args;
  const files = await ensureFiles({ inDir, srcDir, force });
  if (!silent) {
    console.info(c.green('Update Environment'));
    files.table.render();
  }
};

/**
 * Ensure the required configuration files exist within
 * the given directory.
 */
async function ensureFiles(args: { inDir: t.StringDir; srcDir?: t.StringDir; force?: boolean }) {
  const { force = false, srcDir = './docs' } = args;

  type K = 'new' | 'unchanged' | 'updated';
  const table = Cli.table(['files:', '']);
  const logPath = (kind: K, path: string) => {
    path = Fs.Path.trimCwd(path);
    if (kind === 'new') kind = c.green(kind) as K;
    if (kind === 'updated') kind = c.yellow(kind) as K;
    if (kind === 'unchanged') kind = c.gray(c.dim(kind)) as K;
    table.push([`  ${kind}`, c.gray(path)]);
  };

  const hasChanged = async (tmpl: string, path: string) => {
    if (!(await Fs.exists(path))) return false;
    const file = await Deno.readTextFile(path);
    return file !== tmpl;
  };

  const ensure = async (tmpl: string, path: t.StringPath) => {
    path = Fs.join(args.inDir, path);
    const exists = await wrangle.existsAndNotEmpty(path);
    if (!force && exists) {
      return logPath('unchanged', path);
    }
    if (exists) {
      const isDiff = await hasChanged(tmpl, path);
      if (!isDiff) return logPath('unchanged', path);
    }

    await Fs.ensureDir(Fs.dirname(path));
    await Deno.writeTextFile(path, tmpl);
    logPath(exists ? 'updated' : 'new', path);
  };

  // Layout file templates.
  await ensure(Tmpl.Script.main, '.sys/-main.ts');
  await ensure(Tmpl.VSCode.settings, '.vscode/settings.json');
  await ensure(Tmpl.Typescript.config({ srcDir }), '.vitepress/config.ts');
  await ensure(Tmpl.gitignore, '.gitignore');

  await ensure(Tmpl.Pkg.denofile({ pkg }), 'deno.json');
  await ensure(Tmpl.Pkg.package, 'package.json');
  await ensure(Tmpl.Typescript.pkg, 'pkg.ts');

  await ensure(Tmpl.Markdown.index, 'docs/index.md');

  // Finish up.
  return { table };
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
