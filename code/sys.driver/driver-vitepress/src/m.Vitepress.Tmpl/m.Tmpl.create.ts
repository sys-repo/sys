import { Main } from '@sys/main/cmd';
import { pkg as vitePkg } from '@sys/driver-vite';
import { pkg as tmpPkg } from '@sys/tmp';

import { type t, Fs, PATHS, pkg, Pkg, Tmpl } from './common.ts';
import { saveTemplateFiles } from './bundle.write.ts';
export { bundleTemplateFiles } from './bundle.ts';

/**
 * Create a new instance of the bundled file template.
 */
export const create: t.VitepressTmplLib['create'] = async (args) => {
  const { srcDir = './docs' } = args;
  const inDir = Fs.Path.trimCwd(Fs.resolve(args.inDir));
  const templatesDir = Fs.resolve(PATHS.tmp);

  await Fs.remove(templatesDir);
  await saveTemplateFiles(templatesDir);

  return Tmpl.create(templatesDir, (e) => {
    if (e.target.exists && is.userspace(e.target.relative)) {
      /**
       *  🫵  DO NOT adjust user generated
       *     content after the initial creation.
       */
      return e.exclude('user-space');
    }

    if (e.target.relative === 'deno.json') {
      const version = args.version ?? pkg.version;
      const importUri = `jsr:${pkg.name}@${version}`;
      const text = e.text.tmpl
        .replace(/<ENTRY>/g, `${importUri}/main`)
        .replace(/<ENTRY_MAIN>/, `jsr:${Pkg.toString(Main.pkg)}`)
        .replace(/<SELF_IMPORT_URI>/, importUri)
        .replace(/<SELF_IMPORT_NAME>/, pkg.name)
        .replace(/<VITE_VERSION>/, vitePkg.version)
        .replace(/<TMP_VERSION>/, tmpPkg.version);

      return e.modify(text);
    }

    if (e.target.relative === 'package.json') {
      const text = e.text.tmpl.replace(/<TMP_VERSION>/, tmpPkg.version);
      return e.modify(text);
    }

    if (e.target.relative === 'docs/index.md') {
      const text = e.text.tmpl.replace(/\<DRIVER_VER\>/g, pkg.version);
      return e.modify(text);
    }

    /**
     * Content Source ("src").
     * Markdown and Image files
     * Docs:
     *       https://vitepress.dev/reference/site-config#srcdir
     */
    if (e.target.relative === '.vitepress/config.ts') {
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
    const NOT_USERSPACE = ['deno.json', 'package.json', '.npmrc', '.gitignore'];
    const isExcluded = NOT_USERSPACE.some((m) => path.split('/').slice(-1)[0] === m);
    return !isExcluded;
  },
} as const;
