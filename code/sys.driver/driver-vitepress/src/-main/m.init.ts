import { VitePress } from '../m.VitePress/mod.ts';
import { type t, Args, c, Log, pkg } from './common.ts';

type F = t.VitePressMainLib['init'];

/**
 * Scaffold a new project, use the command-line:
 *
 *      deno run -A jsr:@sys/driver-vitepress/init
 */
export const init: F = async (argv, options = {}) => {
  const { silent = false } = options;
  const args = Args.parse<t.MainArgsInit>(argv);
  const { inDir } = args;

  if (!silent) {
    console.info();
    console.info(`${pkg.name} ${c.gray(pkg.version)}`);
  }

  await VitePress.Env.update({ inDir });

  if (!silent) {
    console.info();
    Log.usageAPI();
    console.info();
  }
};
