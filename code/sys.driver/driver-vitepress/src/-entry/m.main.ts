import { Vitepress } from '../m.Vitepress/mod.ts';
import {
  type t,
  Args,
  c,
  DEFAULTS,
  ViteEntry,
  VitepressLog,
  PATHS,
  pkg,
  DenoModule,
} from './common.ts';

type F = t.VitepressEntryLib['main'];

/**
 * Main command entry point.
 *
 * Pass: "--cmd=<sub-command>"
 *       to specify which action to take, and then the paratmers
 *       that pertain to <sub-command> as defined in the entry types.
 */
export const main: F = async (input) => {
  const args = wrangle.args(input ?? Deno.args);
  const cmd = args.cmd ?? DEFAULTS.cmd;

  /**
   * Run the initialization templates.
   */
  if (args.cmd === 'init') {
    const { init } = await import('./u.init.ts');
    await init(args);
    return;
  }

  /**
   * Start HMR development server.
   */
  if (args.cmd === 'dev') {
    VitepressLog.API.log({ cmd: 'dev' });
    const { dir = PATHS.inDir } = args;
    const server = await Vitepress.dev({ inDir: dir, pkg });
    await server.listen();
    return;
  }

  /**
   * Transpile the production bundle (Pkg).
   */
  if (args.cmd === 'build') {
    VitepressLog.API.log({ cmd: 'build' });
    console.info();

    const { dir = PATHS.inDir } = args;
    const res = await Vitepress.build({ inDir: dir, pkg, silent: false });
    console.info(res.toString({ pad: true }));
    return;
  }

  if (args.cmd === 'serve') {
    VitepressLog.API.log({ cmd: 'serve' });
    console.info();
    await ViteEntry.serve(args);
    return;
  }

  if (args.cmd === 'clean') {
    const { clean } = await import('./u.clean.ts');
    await clean(args);
    return;
  }

  if (args.cmd === 'backup') {
    const { dir = PATHS.inDir, includeDist, force } = args;
    await Vitepress.backup({ dir, includeDist, force });
    return;
  }

  if (args.cmd === 'upgrade') {
    const { dir = PATHS.inDir, force = false, dryRun } = args;
    const message = 'Pre-upgrade backup';
    await Vitepress.backup({ dir, includeDist: false, force, message });
    await DenoModule.upgrade({
      name: pkg.name,
      currentVersion: pkg.version,
      targetVersion: args.version,
      dir,
      force,
      dryRun,
    });
    return;
  }

  if (args.cmd === 'help') {
    const { dir = PATHS.inDir } = args;
    await VitepressLog.help({ dir, minimal: false });
    return;
  }

  // Command not matched.
  console.error(`The given --cmd="${c.yellow(c.bold(cmd))}" is not supported`);
};

/**
 * Helpers
 */
const wrangle = {
  args(argv: string[] | t.VitepressEntryArgs) {
    type T = t.VitepressEntryArgs;
    return Array.isArray(argv) ? Args.parse<T>(argv) : (argv as T);
  },
} as const;
