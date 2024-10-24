import { Cmd, ViteConfig as Config, DEFAULTS, type t } from './common.ts';
import { Plugin } from '../m.Vite.Plugin/mod.ts';
import { keyboardFactory, Log } from './u.ts';

/**
 * Tools for running Vite via commands issued to a child process.
 */
export const Vite: t.ViteLib = {
  Config,
  Plugin,

  /**
   * Run the <vite:build> command.
   */
  async build(input: t.ViteBuildArgs): Promise<t.ViteBuildResponse> {
    const { silent = true, Pkg } = input;
    const { env, cmd, args, paths } = wrangle.command(input, 'build');
    const output = await Cmd.invoke({ args, env, silent });
    const ok = output.success;
    const res: t.ViteBuildResponse = {
      ok,
      cmd,
      output,
      paths,
      toString(options = {}) {
        const { pad } = options;
        const stdio = output.toString();
        return Log.Build.toString({ ok, stdio, paths, pad, Pkg });
      },
    };
    return res;
  },

  /**
   * Run the <vite:build> command.
   * Long running processes (spawn → child process).
   *
   * Command:
   *    $ vite dev --port=<1234>
   */
  async dev(input: t.ViteDevArgs): Promise<t.ViteProcess> {
    const { port = DEFAULTS.port, silent = false, Pkg } = input;
    const { env, args, paths } = wrangle.command(input, `dev --port=${port}`);
    const url = `http://localhost:${port}/`;

    if (!silent && Pkg) Log.Entry.log(Pkg, input.input);

    const proc = Cmd.spawn({ args, env, silent });
    const { dispose } = proc;
    const keyboard = keyboardFactory({ Pkg, paths, port, url, dispose });

    await proc.whenReady();
    return {
      proc,
      port,
      url,
      keyboard,
      dispose,
    };
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
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
