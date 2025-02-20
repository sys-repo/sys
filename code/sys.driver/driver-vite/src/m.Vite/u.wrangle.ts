import { type t, Path } from './common.ts';

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
} as const;
