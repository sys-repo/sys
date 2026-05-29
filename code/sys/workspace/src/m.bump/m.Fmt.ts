import { c, Cli, Str, type t } from './common.ts';
import { Semver } from '@sys/std/semver/server';

export const Fmt: t.WorkspaceBump.Fmt.Lib = {
  help(toolname = 'deno task bump') {
    const argsPrefix = toolname === 'deno task bump' ? `${toolname} --` : toolname;
    const text = Cli.Fmt.Help.build({
      tool: toolname,
      summary: 'Bump workspace packages from selected roots or a git baseline ref.',
      note: 'Interactive by default; use `--since` to derive bump roots from git history.',
      usage: [
        toolname,
        `${argsPrefix} --release minor`,
        `${argsPrefix} --since=jsr-publish --dry-run`,
        `${argsPrefix} --since=jsr-publish --dry-run --explain-delta`,
        `${argsPrefix} --from=code/sys/fs --dry-run`,
      ],
      options: [
        ['-h, --help', 'show help'],
        ['--release <patch|minor|major>', 'choose bump kind (default patch)'],
        ['--since <git-ref>', 'derive roots from git ref/tag'],
        ['--from <pkg|path>', 'select roots; conflicts with --since'],
        ['--explain-delta', 'explain --since root selection'],
        ['--dry-run', 'render plan without writing files'],
        ['--non-interactive', 'skip confirmation after root selection'],
      ],
    });
    console.info(text);
    return text;
  },

  invalidRelease(input) {
    const argValue = c.white(c.bold(input));
    const title = c.bold('Warning');
    const msg = `--release="${argValue}" argument not supported.`;
    return c.yellow(`${title}: ${msg}`);
  },

  phase(args) {
    switch (args.kind) {
      case 'collect':
      case 'plan':
        return 'calculating workspace bump plan...';
      case 'integrity':
        return args.followup
          ? `verifying ${args.followup}...`
          : 'checking non-bumped package integrity...';
      case 'apply':
        return 'saving bumped package versions...';
      case 'followup':
        return args.followup ? `running ${args.followup}...` : 'running post-bump followups...';
    }
  },

  selectionLayout(candidates) {
    return candidates.reduce(
      (acc, candidate) => ({
        name: Math.max(acc.name, candidate.name.length),
        version: Math.max(acc.version, Semver.toString(candidate.version.current).length),
      }),
      { name: 0, version: 0 },
    );
  },

  selectionLabel(args) {
    const path = c.gray(args.candidate.pkgPath);
    const name = wrangle.pad(args.candidate.name, args.layout.name);
    const current = wrangle.pad(
      Semver.Fmt.colorize(args.candidate.version.current),
      args.layout.version,
    );
    return `${c.white(name)}  ${current}  ${path}`;
  },

  preflightRow(args) {
    const root = args.rootPaths.has(args.candidate.pkgPath);
    const affected = args.selectedPaths.has(args.candidate.pkgPath);
    const { name, version } = args.candidate;
    const [modScope = '', ...modParts] = name.split('/');
    const modName = modParts.join('/');
    const rootPkg = `${c.cyan(c.bold(modScope))}/${c.cyan(c.bold(modName))}`;
    const autoPkg = c.cyan(c.dim(`${modScope}/${modName}`));
    const idlePkg = c.gray(c.dim(`${modScope}/${modName}`));
    const pkg = root ? rootPkg : affected ? autoPkg : idlePkg;

    const bullet = root ? c.cyan(' •') : affected ? c.cyan(c.dim(' •')) : c.gray(c.dim(' •'));
    const current = root
      ? c.gray(Semver.toString(version.current))
      : affected
      ? c.cyan(c.dim(Semver.toString(version.current)))
      : c.gray(c.dim(Semver.toString(version.current)));
    const arrow = root ? '→' : affected ? c.cyan(c.dim('→')) : c.gray(c.dim('→'));
    const next = root
      ? Semver.Fmt.colorize(version.next, { highlight: args.release })
      : affected
      ? c.cyan(c.dim(Semver.toString(version.next)))
      : c.gray(c.dim(Semver.toString(version.next)));

    return [`${bullet} ${pkg}`, current, arrow, next];
  },

  planSummary(args) {
    const roots = args.plan.roots.map((root) => root.name);
    const table = Cli.Table.create([]);
    table.push([c.gray('affected'), c.white(wrangle.packageCount(args.plan.selected.length))]);
    table.push([c.gray(roots.length === 1 ? 'root' : 'roots'), wrangle.rootValue(roots)]);
    const lines = Str.trimEdgeNewlines(String(table)).split('\n');
    if (roots.length > 1) lines.push(...roots.map((root) => c.cyan(`  ${root}`)));
    return lines;
  },

  dryRun() {
    return c.gray(c.italic('Dry run only. No files updated.'));
  },
};

/**
 * Helpers:
 */
const wrangle = {
  rootValue(roots: readonly string[]) {
    if (roots.length === 0) return c.white(wrangle.packageCount(0));
    if (roots.length === 1) return c.cyan(roots[0]!);
    return c.white(wrangle.packageCount(roots.length));
  },

  packageCount(count: number) {
    return `${count} ${Str.plural(count, 'package')}`;
  },

  pad(value: string, width: number) {
    const visible = Cli.stripAnsi(value).length;
    return visible >= width ? value : `${value}${' '.repeat(width - visible)}`;
  },
} as const;
