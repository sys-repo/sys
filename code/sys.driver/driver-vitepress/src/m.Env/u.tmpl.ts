import { type t, Fs, PATHS, pkg, Tmpl } from './common.ts';
import { saveTemplateFiles } from './u.tmpl.bundle.write.ts';
export { bundleTemplateFiles } from './u.tmpl.bundle.ts';

/**
 * Create a new instance of the bundled file template.
 */
export const createTmpl: t.VitePressTmplFactory = async (args) => {
  const { srcDir = './docs' } = args;
  const inDir = Fs.Path.trimCwd(Fs.resolve(args.inDir));
  const templatesDir = Fs.resolve(PATHS.tmp);
  if (!(await Fs.exists(templatesDir))) await saveTemplateFiles(templatesDir);

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

    console.log('file.path', file.path, file.path.endsWith('/.vitepress/config.ts'));

    if (file.path.endsWith('/.vitepress/config.ts')) {
      console.log('srcDir', srcDir);
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
