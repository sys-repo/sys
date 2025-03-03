import { Vitepress } from '../m.Vitepress/mod.ts';
import { type t, c, PATHS, pkg, Semver, ViteLog } from './common.ts';

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

  await Vitepress.Tmpl.write({ inDir: dir });

  if (!silent) {
    console.info();
    ViteLog.API.log();

    const fmtVersion = Semver.Fmt.colorize(pkg.version);
    const fmtModule = `${pkg.name}${c.dim('@')}${fmtVersion}`;

    console.info();
    console.info(c.brightCyan('↑ Init Complete:'), `${fmtModule}`);
    console.info();
  }
}
