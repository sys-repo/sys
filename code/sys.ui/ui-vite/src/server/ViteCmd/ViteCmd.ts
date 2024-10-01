import { Cmd, DEFAULTS, Path, slug, type t } from './common.ts';

const resolve = Path.resolve;

/**
 * Tools for running Vite via commands issued to a child process.
 */
export const ViteCmd: t.ViteCmdLib = {
  /**
   * Output directory paths.
   */
  outDir: {
    default: DEFAULTS.path.outDir,
    test: {
      base: DEFAULTS.path.outDirTest,
      random: (uniq) => `${ViteCmd.outDir.test.base}-${uniq ?? slug()}`,
    },
  },

  /**
   * Prepare paths for the vite build.
   */
  paths(options = {}) {
    const DEF = DEFAULTS.path;
    const input = resolve(options.input ?? DEF.input);
    const outDir = resolve(options.outDir ?? DEF.outDir);
    return { input, outDir };
  },

  /**
   * Prepares a set of known env-vars to hand to the child process.
   */
  env(options = {}) {
    const paths = ViteCmd.paths(options);
    const VITE_INPUT = paths.input;
    const VITE_OUTDIR = paths.outDir;
    return { VITE_INPUT, VITE_OUTDIR };
  },

  /**
   * Run the <vite:build> command.
   */
  async build(input) {
    const { silent = true } = input;
    const { env, cmd, args, paths } = wrangle.command(input, 'build');
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
  dev(input) {
    const { port = DEFAULTS.port, silent = false } = input;
    const { env, args } = wrangle.command(input, `dev --port=${port}`);
    const url = `http://localhost:${port}/`;

    const proc = Cmd.spawn({ args, env, silent });
    const { whenReady, dispose } = proc;

    return {
      proc,
      port,
      url,
      whenReady,
      dispose,
    };
  },
} as const;

/**
 * Helpers
 */
const wrangle = {
  command(options: t.ViteEnvOptions, arg: string) {
    const env = ViteCmd.env(options);
    const paths = ViteCmd.paths(options);
    const configFile = DEFAULTS.path.configFile;
    const cmd = `deno run -A --node-modules-dir npm:vite ${arg} --config=${configFile}`;
    const args = cmd.split(' ').slice(1);
    return { cmd, args, env, paths } as const;
  },
} as const;
