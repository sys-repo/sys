import { type t, Fs, PATHS, pkg, Tmpl } from './common.ts';
import { saveTemplateFiles } from './tmpl.bundle.write.ts';
export { bundleTemplateFiles } from './tmpl.bundle.ts';

/**
 * Create a new instance of the bundled file template.
 */
export const createTmpl: t.VitePressTmplFactory = async (args) => {
  const { srcDir = './docs' } = args;
  const inDir = Fs.Path.trimCwd(Fs.resolve(args.inDir));
  const templatesDir = Fs.resolve(PATHS.tmp);
  await Fs.remove(templatesDir);
  await saveTemplateFiles(templatesDir);

  return Tmpl.create(templatesDir, (e) => {
    const file = e.file.target;
    const subpath = inDir ? file.path.slice(inDir.length + 1) : file.path;

    if (file.exists && is.userspace(subpath)) {
      /**
       *  🫵  DO NOT adjust user generated
       *     content after the initial creation.
       */
      return e.exclude('user-space');
    }

    const version = args.version ?? pkg.version;
    if (file.name === 'deno.json') {
      const importUri = `jsr:${pkg.name}@${version}`;
      const text = e.text.tmpl
        .replace(/<ENTRY>/g, `${importUri}/main`)
        .replace(/<SELF_IMPORT_URI>/, importUri)
        .replace(/<SELF_IMPORT_NAME>/, pkg.name);

      return e.modify(text);
    }


    if (file.path.endsWith('docs/index.md')) {
      console.log('file', file);

      const text = e.text.tmpl.replace(/\<DRIVER_VER\>/g, pkg.version);
      return e.modify(text);

      /**
       * TODO 🐷
       * write the version generated with in
       */
    }

    /**
     * Content Source (Src)
     * Markdown and Image files
     * Docs:
     *       https://vitepress.dev/reference/site-config#srcdir
     */
    if (file.path.endsWith('.vitepress/config.ts')) {
      const text = e.text.tmpl.replace(/<SRC_DIR>/, srcDir);
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
    const exclude = ['.gitignore', 'deno.json', 'package.json'];
    const isExcluded = exclude.some((m) => path.split('/').slice(-1)[0] === m);
    return !isExcluded;
  },
} as const;
