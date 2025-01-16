import { VitePress } from '../m.VitePress/mod.ts';
import { type t, c, Log, PATHS, pkg } from './common.ts';

/**
 * Run the initialization templates.
 */
export async function init(args: t.VitePressEntryArgsInit) {
  const { inDir = PATHS.inDir, silent = false } = args;
  if (args.cmd !== 'init') return;

  if (!silent) {
    console.info();
    console.info(`${pkg.name} ${c.gray(pkg.version)}`);
  }

  await VitePress.Env.update({ inDir });

  if (!silent) {
    console.info();
    Log.UsageAPI.log();
    console.info();
  }
}
