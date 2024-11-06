import { ViteConfig as Config, type t } from './common.ts';
/**
 * Helpers
 */
export const Wrangle = {
  command(options: t.ViteConfigPathsOptions, arg: string) {
    const paths = Config.paths(options);

    /**
     * NB: The {env} is used to pass dynamic configuration options
     *     to the vite configuration in the child process.
     */
    const env = {
      VITE_INPUT: paths.input,
      VITE_OUTDIR: paths.outDir,
    };

    const cmd = `deno run -A --node-modules-dir npm:vite ${arg}`;
    const args = cmd.split(' ').slice(1);
    return { cmd, args, env, paths } as const;
  },
} as const;
