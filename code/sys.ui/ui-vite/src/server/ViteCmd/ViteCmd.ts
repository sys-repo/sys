import { c, Cmd, DEFAULTS, Path, readKeypress, slug, type t } from './common.ts';

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
    const { port = DEFAULTS.port, silent = false, Pkg } = input;
    const { env, args } = wrangle.command(input, `dev --port=${port}`);
    const url = `http://localhost:${port}/`;

    if (!silent && Pkg) Log.entry(Pkg, input.input);

    const proc = Cmd.spawn({ args, env, silent });
    const { whenReady, dispose } = proc;
    const keyboard = keyboardFactory({ port, url, dispose });

    return {
      proc,
      port,
      url,
      whenReady,
      keyboard,
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

const Log = {
  /**
   * Startup log.
   */
  entry(pkg: t.Pkg, input: t.StringPath) {
    console.info();
    console.info(c.gray(`Module:       ${c.white(pkg.name)}@${pkg.version}`));
    console.info(c.brightGreen(`entry point:  ${c.gray(input)}`));
  },
};

/**
 * Generates a terminal keyboard listener with common commands.
 */
export function keyboardFactory(args: { port: number; url: string; dispose: () => Promise<void> }) {
  const { url, dispose } = args;
  const sh = Cmd.sh();

  return async () => {
    for await (const keypress of readKeypress()) {
      const { ctrlKey, key } = keypress;

      if (key === 'o') {
        sh.run(`open ${url}`); // Open on [o] key.
      }

      if (ctrlKey && key === 'c') {
        await dispose();
        Deno.exit(0); // Exit on [Ctrl + C].
      }
    }
  };
}
