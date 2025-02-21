import { type t, Path, ViteConfig } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  async command(paths: t.ViteConfigPaths, arg: string) {
    const config = Path.join(paths.cwd, 'vite.config.ts');
    const cmd = `deno run -A --node-modules-dir npm:vite ${arg} --config=${config}`;
    const args = cmd.split(' ').slice(1);
    return { cmd, args } as const;
  },

  async pathsFromConfigfile(cwd?: t.StringDir) {
    const rootDir = cwd || Path.cwd();
    const filename = 'vite.config.ts';
    const path = Path.join(rootDir, filename);

    const res = await ViteConfig.fromFile(path);
    let paths = res.module.paths;

    if (!paths) {
      // TEMP 🐷
      console.log('res', { ...res });

      const err = `Failed to load paths from [${filename}], ensure it exports "paths". Source: ${path}`;
      throw new Error(err);
    }

    const delta = Path.relative(paths.cwd, rootDir);
    if (delta) {
      /**
       * HACK:
       *    There is a delta between the response {paths} current-working-directory (CWD)
       *    and the actual CWD. Adjust the relevant subpaths to account for this.
       * NB:
       *    One scenario where this happens happen when testing within the mono-repo and
       *    simulating operating in a root CWD, but actually building into ".tmp/sample/"
       */
      const entry = Path.normalize(Path.join(delta, paths.app.entry));
      const outDir = Path.normalize(Path.join(delta, paths.app.outDir));
      const app = { ...paths.app, entry, outDir };
      paths = { ...paths, app };
    }

    return paths;
  },
} as const;
