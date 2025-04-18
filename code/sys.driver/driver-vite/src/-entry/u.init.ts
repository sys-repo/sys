import { Vite } from '../m.Vite/mod.ts';
import { type t, c, pkg, Semver, ViteLog, V } from './common.ts';

/**
 * Args validation:
 */
export const TmplKindSchema = V.union([V.literal('Default'), V.literal('ComponentLib')]);
export const InitSchema = V.object({
  cmd: V.literal('init'),
  dir: V.optional(V.string()),
  silent: V.optional(V.boolean()),
  tmpl: V.optional(TmplKindSchema, 'Default'),
});

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
    const validated = V.safeParse(TmplKindSchema, args.tmpl);
    const issues = validated.issues;
    issues?.forEach((issue) => console.warn(c.yellow('Parse Error: --tmpl:'), issue.message));
    return issues ? 'Default' : validated.output;
  },
} as const;
