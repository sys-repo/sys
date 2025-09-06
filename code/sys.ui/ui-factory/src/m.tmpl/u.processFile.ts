import { type t } from './common.ts';

export function makeProcessor(bundleRoot: t.StringDir): t.FileMapProcessor {
  const root = (bundleRoot ?? '').trim();
  const prefix = root ? `${root}/` : '';

  return async (e) => {
    /**
     * 1) If a bundleRoot was provided, only include files under it.
     *    (No global top-level passthrough; we rely on tmpl.filter for scope).
     */
    if (root) {
      const isUnderRoot = e.path === root || e.path.startsWith(prefix);
      if (!isUnderRoot) return e.skip(`not within "${root}/"`);
    }

    /**
     * 2) If under root, strip that prefix so files land at the target root.
     */
    if (root && e.path.startsWith(prefix)) {
      const next = e.path.slice(prefix.length);
      if (!next) return e.skip('empty path after strip');
      e.target.rename(next, true);
    }

    /**
     * 3) Example: turn ".gitignore-" into ".gitignore".
     */
    if (e.text && e.path.endsWith('.gitignore-')) {
      e.target.rename(e.path.replace(/-$/, ''));
    }
  };
}
