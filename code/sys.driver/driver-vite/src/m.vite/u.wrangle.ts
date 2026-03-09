import { type t, Path, ViteConfig } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  async command(paths: t.ViteConfigPaths, arg: string) {
    const config = 'vite.config.ts';
    const args = wrangle.args(arg, config);
    const cmd = ['deno', ...args].join(' ');
    return { cmd, args } as const;
  },

  async pathsFromConfigfile(cwd?: t.StringDir) {
    const rootDir = cwd || Path.cwd();
    const filename = 'vite.config.ts';
    const path = Path.join(rootDir, filename);

    const res = await ViteConfig.fromFile(path);
    let paths = res.paths;

    if (!paths) {
      const err = `Failed to load paths from [${filename}], ensure it exports "paths". Source: ${path}`;
      console.error(res.error);
      throw new Error(err);
    }

    const delta = Path.relative(paths.cwd, rootDir);
    if (delta) {
      /**
       * When config discovery is performed from a copied fixture or nested temp root,
       * the resolved config paths can be rooted at a different CWD than the caller.
       * Adjust the application entry/output subpaths to preserve the caller-relative
       * build layout.
       */
      const entry = Path.normalize(Path.join(delta, paths.app.entry));
      const outDir = Path.normalize(Path.join(delta, paths.app.outDir));
      const app = { ...paths.app, entry, outDir };
      paths = { ...paths, app };
    }

    return paths;
  },
} as const;

const wrangle = {
  args(arg: string, config: string) {
    const [cmd, ...rest] = arg.trim().split(/\s+/).filter(Boolean);
    const permissions = wrangle.permissions(cmd ?? '');
    return [
      'run',
      ...permissions,
      '--node-modules-dir',
      'npm:vite',
      cmd,
      ...rest,
      `--config=${config}`,
    ].filter(Boolean);
  },

  permissions(cmd: string) {
    const common = [
      '--allow-read',
      '--allow-write',
      '--allow-env',
      '--allow-net',
      '--allow-run',
      '--allow-ffi',
    ];

    if (cmd === 'build') return common;
    if (cmd === 'dev') return [...common, '--allow-sys=networkInterfaces'];
    return common;
  },
} as const;
