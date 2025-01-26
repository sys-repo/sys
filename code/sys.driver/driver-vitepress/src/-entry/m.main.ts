import { VitePress } from '../m.Vitepress/mod.ts';
import { type t, Args, c, DEFAULTS, Env, VitepressLog, PATHS, pkg } from './common.ts';

type F = t.VitepressEntryLib['main'];

/**
 * Main command entry point.
 *
 * Pass: "--cmd=<sub-command>"
 *       to specify which action to take, and then the paratmers
 *       that pertain to <sub-command> as defined in the <VitePressCmd> type.
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
    VitepressLog.UsageAPI.log({ cmd: 'dev' });
    const { inDir = PATHS.inDir } = args;
    const server = await VitePress.dev({ inDir, pkg });
    await server.listen();
    return;
  }

  /**
   * Transpile the production bundle (Pkg).
   */
  if (args.cmd === 'build') {
    VitepressLog.UsageAPI.log({ cmd: 'build' });
    const { inDir = PATHS.inDir } = args;
    const res = await VitePress.build({ inDir, pkg });
    console.info(res.toString({ pad: true }));
    return;
  }

  if (args.cmd === 'serve') {
    VitepressLog.UsageAPI.log({ cmd: 'serve' });
    const { serve } = await import('./u.serve.ts');
    await serve(args);
    return;
  }

  if (args.cmd === 'clean') {
    const { clean } = await import('./u.clean.ts');
    await clean(args);
    return;
  }

  if (args.cmd === 'backup') {
    const { inDir = PATHS.inDir, includeDist, force } = args;
    await Env.backup({ inDir, includeDist, force });
    return;
  }

  if (args.cmd === 'upgrade') {
    const { upgrade } = await import('./u.upgrade.ts');
    await upgrade(args);
    return;
  }

  if (args.cmd === 'help') {
    const { inDir = PATHS.inDir } = args;
    await VitepressLog.help({ inDir, minimal: false });
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
