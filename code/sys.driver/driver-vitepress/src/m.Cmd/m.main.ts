import { VitePress } from '../m.VitePress/mod.ts';
import { type t, Args, c, DEFAULTS, PATHS, Log, pkg } from './common.ts';

type F = t.VitePressCmdLib['main'];

/**
 * Main command entry point.
 *
 * Pass: "--cmd=<sub-command>"
 *       to specify which action to take, and then the paratmers
 *       that pertain to <sub-command> as defined in the <VitePressCmd> type.
 */
export const main: F = async (argv) => {
  const args = Args.parse<t.CmdArgsMain>(argv);
  const cmd = args.cmd ?? DEFAULTS.cmd;

  /**
   * Start HMR development server.
   */
  if (args.cmd === 'dev') {
    Log.usageAPI({ cmd: 'dev' });
    const { inDir = PATHS.inDir } = args;
    const server = await VitePress.dev({ inDir, pkg });
    await server.listen();
    return;
  }

  /**
   * Transpile the production bundle (Pkg).
   */
  if (args.cmd === 'build') {
    Log.usageAPI({ cmd: 'build' });
    const { inDir = PATHS.inDir } = args;
    const res = await VitePress.build({ inDir, pkg });
    console.info(res.toString({ pad: true }));
    return;
  }

  if (args.cmd === 'serve') {
    Log.usageAPI({ cmd: 'serve' });
    const { serve } = await import('./u.serve.ts');
    await serve(argv);
    return;
  }

  if (args.cmd === 'clean') {
    const { clean } = await import('./u.clean.ts');
    await clean(argv);
    return;
  }

  if (args.cmd === 'backup') {
    Log.usageAPI({ cmd: 'backup' });
    const { backup } = await import('./u.backup.ts');
    await backup(argv);
    return;
  }

  if (args.cmd === 'upgrade') {
    const { upgrade } = await import('./u.upgrade.ts');
    await upgrade(argv);
    return;
  }

  if (args.cmd === 'help') {
    const { inDir = PATHS.inDir } = args;
    await Log.help({ inDir, minimal: false });
    return;
  }

  // Command not matched.
  console.error(`The given --cmd="${c.yellow(c.bold(cmd))}" is not supported`);
};
