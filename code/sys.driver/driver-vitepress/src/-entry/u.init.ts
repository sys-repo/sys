import { VitePress } from '../m.Vitepress/mod.ts';
import { type t, c, PATHS, pkg, VitepressLog } from './common.ts';

/**
 * Run the initialization templates.
 */
export async function init(args: t.VitepressEntryArgsInit) {
  const { inDir = PATHS.inDir, silent = false } = args;
  if (args.cmd !== 'init') return;

  if (!silent) {
    console.info();
    console.info(`${pkg.name} ${c.gray(pkg.version)}`);
  }

  await VitePress.Env.Tmpl.update({ inDir });

  if (!silent) {
    console.info();
    VitepressLog.UsageAPI.log();
    console.info();
  }
}
