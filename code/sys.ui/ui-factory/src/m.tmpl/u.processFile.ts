import { type t } from './common.ts';

type Args = {
  /** The root folder of the template within '/-tmpl/'. */
  bundleRoot?: t.StringDir;
};

export function createFileProcessor(args: Args): t.FileMapProcessor {
  const root = (args.bundleRoot ?? '').trim();

  return async (e) => {
    /**
     * 1) If a bundleRoot was provided, only include files under it.
     */
    if (root) {
      const prefix = `${root}/`;
      const isUnderRoot = e.path === root || e.path.startsWith(prefix);

      // Allow top-level files like README.md to pass through (no slash).
      const isTopLevel = !e.path.includes('/');

      if (!isUnderRoot && !isTopLevel) {
        return e.skip(`excluded: not within "${root}/"`);
      }

      // If under root, strip that prefix so files land at the target root.
      if (isUnderRoot && e.path.startsWith(prefix)) {
        const rest = e.path.slice(prefix.length);
        if (rest.length === 0) return e.skip('excluded: empty path after strip');
        e.target.rename(rest as t.StringPath);
      }
    }

    /**
     * 2) Example special-case: turn ".gitignore-" into ".gitignore" if such a file exists in bundle.
     */
    if (e.text && e.path.endsWith('.gitignore-')) {
      e.target.rename(e.path.replace(/-$/, '') as t.StringPath);
    }

    /**
     * 3) Potential future per-file text transforms.
     */
    // if (e.text && e.path.endsWith('README.md')) {
    //   e.modify(`${e.text}\n<!-- patched by processor -->\n`);
    // }
  };
}
