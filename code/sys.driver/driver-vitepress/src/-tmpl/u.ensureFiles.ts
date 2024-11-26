import { type t, Cli, Fs, c, pkg } from './common.ts';
import { Tmpl } from './m.Tmpl.ts';

/**
 * Ensure the required configuration files exist within
 * the given directory.
 */
export async function ensureFiles(args: {
  inDir: t.StringDir;
  srcDir?: t.StringDir;
  force?: boolean;
  filter?: (path: t.StringPath) => boolean;
}) {
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
    if (args.filter) {
      if (!args.filter(path)) return;
    }

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
  await ensure(Tmpl.Typescript.main, '.sys/-main.ts');
  await ensure(Tmpl.VSCode.settings, '.vscode/settings.json');
  await ensure(Tmpl.Typescript.config({ srcDir }), '.vitepress/config.ts');
  await ensure(Tmpl.gitignore, '.gitignore');

  await ensure(Tmpl.Pkg.denofile({ pkg }), 'deno.json');
  await ensure(Tmpl.Pkg.package, 'package.json');
  await ensure(Tmpl.Typescript.pkg, 'pkg.ts');
  await ensure(Tmpl.Typescript.nav, 'pkg.nav.ts');

  await ensure(Tmpl.Markdown.index, 'docs/index.md');
  await ensure(Tmpl.Markdown.sample({ title: 'Title-A' }), 'docs/section-a/item-a.md');
  await ensure(Tmpl.Markdown.sample({ title: 'Title-B' }), 'docs/section-a/item-b.md');

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
