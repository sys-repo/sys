import { VitePress } from '../m.Vitepress/mod.ts';
import { type t, c, PATHS, pkg, VitepressLog } from './common.ts';

/**
 * Run the initialization templates.
 */
export async function init(args: t.VitepressEntryArgsInit) {
  const { dir = PATHS.inDir, silent = false } = args;
  if (args.cmd !== 'init') return;

  if (!silent) {
    console.info();
    console.info(`${pkg.name} ${c.gray(pkg.version)}`);
  }

  await VitePress.Tmpl.update({ inDir: dir });

  if (!silent) {
    console.info();
    VitepressLog.API.log();
    console.info();
  }
}
