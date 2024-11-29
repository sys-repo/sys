import { VitePress } from '../m.VitePress/mod.ts';
import { type t, Args, Log } from './common.ts';

type F = t.VitePressCmdLib['init'];

/**
 * Scaffold a new project, use the command-line:
 *
 *      deno run -A jsr:@sys/driver-vitepress/init
 */
export const init: F = async (argv, options = {}) => {
  const { silent = false } = options;
  const args = Args.parse<t.CmdArgsInit>(argv);
  const { inDir, srcDir } = args;

  if (!silent) console.info();
  await VitePress.Env.update({ inDir, srcDir });
  if (!silent) Log.commandAPI();
};
