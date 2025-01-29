import { Main } from '@sys/main/cmd';
import { type t, Fs, PATHS, pkg, Pkg, Tmpl } from './common.ts';
import { Bundle } from './m.Bundle.ts';

/**
 * Create a new instance of the bundled file template.
 */
export const create: t.ViteTmplLib['create'] = async (args) => {
  const templatesDir = Fs.resolve(PATHS.tmp);

  await Fs.remove(templatesDir);
  await Bundle.toFilesystem(templatesDir);

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
        .replace(/<SELF_IMPORT_NAME>/, pkg.name);

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
    /**
     * NOTE: no "user-space" concept as of yet.
     */
    return false;
  },
} as const;
