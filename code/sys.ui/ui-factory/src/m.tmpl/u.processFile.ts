import { type t } from './common.ts';

type Args = {
  /** The root folder of the template within '/-tmpl/'. */
  bundleRoot?: t.StringDir;
};

export function makeProcessor(args: Args): t.FileMapProcessor {
  const root = (args.bundleRoot ?? '').trim();
  const prefix = root ? `${root}/` : '';

  return async (e) => {
    /**
     * 1) If a bundleRoot was provided, only include files under it.
     *    (No global top-level passthrough; we rely on tmpl.filter for scope).
     */
    if (root) {
      const isUnderRoot = e.path === root || e.path.startsWith(prefix);
      if (!isUnderRoot) return e.skip(`excluded: not within "${root}/"`);
    }

    /**
     * 2) If under root, strip that prefix so files land at the target root.
     */
    if (root && e.path.startsWith(prefix)) {
      const path = e.path.slice(prefix.length);
      if (path.length === 0) return e.skip('excluded: empty path after strip');
      const silent = true;
      e.target.rename(path, silent);
    }

    /**
     * 3) Example: turn ".gitignore-" into ".gitignore".
     */
    if (e.text && e.path.endsWith('.gitignore-')) {
      e.target.rename(e.path.replace(/-$/, ''));
    }
  };
}
