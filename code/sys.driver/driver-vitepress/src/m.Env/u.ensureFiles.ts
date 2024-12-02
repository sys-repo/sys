import { Tmpl } from '../-tmpl/mod.ts';
import { type t, Fs, pkg } from './common.ts';

/**
 * Ensure the required configuration files exist within
 * the given directory.
 */
export async function ensureFiles(args: {
  inDir: t.StringDir;
  srcDir?: t.StringDir;
  force?: boolean;
  version?: t.StringSemver;
  filter?: (path: t.StringPath) => boolean;
}) {
  const { force = false, srcDir = './docs' } = args;
  const version = args.version ?? pkg.version;

  type K = t.VitePressFileUpdate['kind'];
  const files: t.VitePressFileUpdate[] = [];
  const logPath = (kind: K, path: t.StringPath) => {
    files.push({ kind, path });
  };

  const hasChanged = async (tmpl: string, path: t.StringPath) => {
    if (!(await Fs.exists(path))) return false;
    const file = await Deno.readTextFile(path);
    return file !== tmpl;
  };

  const ensure = async (tmpl: string, path: t.StringPath) => {
    if (args.filter) {
      //Custom filter.
      if (!args.filter(path)) return;
    }

    path = Fs.join(args.inDir, path);
    const exists = await wrangle.existsAndNotEmpty(path);
    if (!force && exists) {
      if (is.userFile(path)) return logPath('UserFile', path); // Don't touch user files, as they may have changed them.
      return logPath('Unchanged', path);
    }
    if (exists) {
      const isDiff = await hasChanged(tmpl, path);
      if (!isDiff) return logPath('Unchanged', path);
    }

    await Fs.ensureDir(Fs.dirname(path));
    await Deno.writeTextFile(path, tmpl);
    logPath(exists ? 'Updated' : 'Created', path);
  };

  // Layout file templates.
  await ensure(Tmpl.Typescript.main, '.sys/-main.ts');
  await ensure(Tmpl.VSCode.settings, '.vscode/settings.json');
  await ensure(Tmpl.Typescript.config({ srcDir }), '.vitepress/config.ts');
  await ensure(Tmpl.gitignore, '.gitignore');

  await ensure(Tmpl.Pkg.denofile({ pkg: { ...pkg, version } }), 'deno.json');
  await ensure(Tmpl.Pkg.package, 'package.json');
  await ensure(Tmpl.Typescript.pkg, 'pkg.ts');
  await ensure(Tmpl.Typescript.nav, 'pkg.nav.ts');

  await ensure(Tmpl.Docs.md.index, 'docs/index.md');
  await ensure(Tmpl.Docs.md.sample({ title: 'Title-A' }), 'docs/section-a/item-a.md');
  await ensure(Tmpl.Docs.md.sample({ title: 'Title-B' }), 'docs/section-a/item-b.md');
  await ensure(Tmpl.Docs.ts.foo, 'docs/foo.ts');

  // Finish up.
  return { files } as const;
}

/**
 * Helpers
 */
const wrangle = {
  async existsAndNotEmpty(target: t.StringPath) {
    const exists = await Fs.exists(target);
    if (exists) {
      const text = await Deno.readTextFile(Fs.resolve(target));
      const isEmpty = (text ?? '').length === 0;
      if (isEmpty) return false;
    }
    return exists;
  },
} as const;

const is = {
  withinHiddenDir(path: string): boolean {
    const dirs = path.split('/').slice(0, -1);
    return dirs.some((dir) => dir.startsWith('.'));
  },

  userFile(path: string): boolean {
    if (is.withinHiddenDir(path)) return false;
    const ignore = ['.gitignore', 'deno.json', 'package.json'];
    return !ignore.some((m) => path.split('/').slice(-1)[0] === m);
  },
} as const;
