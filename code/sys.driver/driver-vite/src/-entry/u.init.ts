import { Vite } from '../m.Vite/mod.ts';
import { type t, c, pkg, Semver, ViteLog } from './common.ts';

/**
 * Run the initialization templates.
 */
export async function init(args: t.ViteEntryArgsInit) {
  if (args.cmd !== 'init') return;
  const { silent = false } = args;

  if (!silent) {
    console.info();
    console.info(`${pkg.name} ${c.gray(pkg.version)}`);
  }

  await Vite.Tmpl.write({
    in: args.dir,
    tmpl: wrangle.tmplKind(args),
    silent,
  });

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

/**
 * Helpers
 */
const wrangle = {
  tmplKind(args: t.ViteEntryArgsInit): t.ViteTmplKind {
    if (!args.tmpl || args.tmpl === true) return 'Default';
    return args.tmpl;
  },
} as const;
