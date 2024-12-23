import { type t, Fs, pkg, Tmpl } from './common.ts';

export const createTmpl: t.VitePressTmplFactory = async (args) => {
  const { srcDir = './docs' } = args;
  const templatesDir = Fs.resolve('./src/-tmpl');
  const inDir = Fs.Path.trimCwd(Fs.resolve(args.inDir));

  return Tmpl.create(templatesDir, (e) => {
    const file = e.file.target;
    const subpath = file.path.slice(inDir.length + 1);

    if (file.exists && is.userspace(subpath)) {
      return e.exclude('user-space');
    }

    if (file.name === 'deno.json') {
      const version = args.version ?? pkg.version;
      const importUri = `jsr:${pkg.name}@${version}`;
      const text = e.text
        .replace(/<ENTRY>/g, `${importUri}/main`)
        .replace(/<SELF_IMPORT_URI>/, importUri)
        .replace(/<SELF_IMPORT_NAME>/, pkg.name);
      return e.modify(text);
    }

    if (file.path.endsWith('/.vitepress/config.ts')) {
      const text = e.text.replace(/<SRC_DIR>/, srcDir);
      return e.modify(text);
    }
  });
};

/**
 * Helpers
 */
const is = {
  withinHiddenDir(path: string): boolean {
    const dirs = path.split('/').slice(0, -1);
    return dirs.some((dir) => dir.startsWith('.'));
  },
  userspace(path: string): boolean {
    if (is.withinHiddenDir(path)) return false;
    const ignore = ['.gitignore', 'deno.json', 'package.json'];
    const isIgnored = ignore.some((m) => path.split('/').slice(-1)[0] === m);
    return !isIgnored;
  },
} as const;
