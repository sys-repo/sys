import { ViteConfig as Config } from '../ViteConfig/mod.ts';
import { Cmd, DEFAULTS, type t } from './common.ts';
import { keyboardFactory, Log } from './u.ts';

/**
 * Tools for running Vite via commands issued to a child process.
 */
export const ViteCmd: t.ViteCmdLib = {
  Config,

  /**
   * Run the <vite:build> command.
   */
  async build(input) {
    const { silent = true } = input;
    const { env, cmd, args, paths } = await wrangle.command(input, 'build');
    const output = await Cmd.invoke({ args, env, silent });
    return {
      ok: output.success,
      cmd,
      output,
      paths,
      toString: () => output.toString(),
    };
  },

  /**
   * Run the <vite:build> command.
   * Long running processes (spawn → child process).
   *
   * Command:
   *    $ vite dev --port=<1234>
   */
  async dev(input) {
    const { port = DEFAULTS.port, silent = false, Pkg } = input;
    const { env, args } = await wrangle.command(input, `dev --port=${port}`);
    const url = `http://localhost:${port}/`;

    if (!silent && Pkg) Log.entry(Pkg, input.input);

    const proc = Cmd.spawn({ args, env, silent });
    const { dispose } = proc;
    const keyboard = keyboardFactory({ port, url, dispose });

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
  async command(options: t.ViteConfigPathsOptions, arg: string) {
    const paths = Config.paths(options);

    const VITE_INPUT = paths.input;
    const VITE_OUTDIR = paths.outDir;
    const env = { VITE_INPUT, VITE_OUTDIR };

    const configFile = DEFAULTS.configFile;
    const cmd = `deno run -A --node-modules-dir npm:vite ${arg} --config=${configFile}`;
    const args = cmd.split(' ').slice(1);

    return { cmd, args, env, paths } as const;
  },
} as const;
