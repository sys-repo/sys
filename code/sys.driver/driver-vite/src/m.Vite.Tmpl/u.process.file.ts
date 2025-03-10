import { type t, pkg } from './common.ts';

/**
 * File processing rules for the template.
 */
export function createFileProcessor(args: t.ViteTmplCreateArgs): t.TmplProcessFile {
  return async (e) => {
    const ctx = e.ctx as t.ViteTmplCtx;
    if (!ctx) throw new Error(`Expected a {ctx} to be passed to the template file processor`);

    if (e.target.exists && is.userspace(e.target.relative)) {
      /**
       *  🫵  DO NOT adjust user generated
       *     content after the initial creation.
       */
      return e.exclude('user-space');
    }

    if (e.contentType !== 'text') return;

    if (e.target.relative === 'deno.json') {
      /**
       * Update versions in `deno.json`:
       */
      const version = args.version ?? pkg.version;
      const entryUri = `jsr:${pkg.name}@${version}`;
      const text = e.text.tmpl.replace(/<ENTRY>/g, `${entryUri}/main`);
      return e.modify(text);
    }

    if (e.target.file.name === '.gitignore-') {
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
     * Example:
     *      contract: "anything hidden is not editable by user."
     */
    return false;
  },
} as const;
