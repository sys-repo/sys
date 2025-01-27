import { Vite } from '../m.Vite/mod.ts';
import { type t, c, pkg, ViteLog } from './common.ts';

/**
 * Run the initialization templates.
 */
export async function init(args: t.ViteEntryArgsInit) {
  const { silent = false } = args;
  if (args.cmd !== 'init') return;

  if (!silent) {
    console.info();
    console.info(`${pkg.name} ${c.gray(pkg.version)}`);
  }

  await Vite.Tmpl.update({ in: args.in, silent });

  if (!silent) {
    console.info();
    ViteLog.API.log();
    console.info();
  }
}
