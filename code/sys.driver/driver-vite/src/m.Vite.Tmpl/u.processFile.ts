import { Main } from '@sys/main/cmd';
import { pkg as pkgSysStd } from '@sys/std';
import { type t, pkg, Pkg } from './common.ts';

/**
 * File processing rules for the template.
 */
export function createFileProcessor(args: t.ViteTmplCreateArgs): t.TmplProcessFile {
  return async (e) => {
    if (e.target.exists && is.userspace(e.target.relative)) {
      /**
       *  🫵  DO NOT adjust user generated
       *     content after the initial creation.
       */
      return e.exclude('user-space');
    }

    if (e.target.relative === 'deno.json') {
      /**
       * Update versions in `deno.json`:
       */
      const version = args.version ?? pkg.version;
      const importUri = `jsr:${pkg.name}@${version}`;
      const text = e.text.tmpl
        .replace(/<ENTRY>/g, `${importUri}/main`)
        .replace(/<ENTRY_SYS>/, `jsr:${Pkg.toString(Main.pkg)}`)
        .replace(/<SELF_IMPORT_URI>/, importUri)
        .replace(/<SELF_IMPORT_NAME>/, pkg.name)
        .replace(/<SYS_STD_VER>/, pkgSysStd.version);

      return e.modify(text);
    }

    if (e.target.file.name === '.gitignore_') {
      /**
       * Rename to ".gitignore"
       * NB: This ensure the template files themselves are not ignored within the mono-repo
       *     but initiating "consumer" module does have a proper `.gitignore` file.
       */
      e.rename('.gitignore');
    }
  };
}

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
