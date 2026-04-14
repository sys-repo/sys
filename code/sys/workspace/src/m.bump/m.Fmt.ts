import { c, Cli, type t } from './common.ts';
import { Semver } from '@sys/std/semver/server';

export const Fmt: t.WorkspaceBump.Fmt.Lib = {
  help() {
    Cli.Fmt.Help.render({
      tool: 'deno task bump',
      summary: 'Bump workspace packages from a selected topological root.',
      note: 'Interactive by default; `--from` supports scripted selective bumps.',
      usage: [
        'deno task bump',
        'deno task bump -- --release minor',
        'deno task bump -- --from=@scope/pkg --non-interactive --dry-run',
      ],
      options: [
        ['-h, --help', 'show help'],
        ['--release <patch|minor|major>', 'choose the semver bump kind (default: patch)'],
        ['--from <package-name|package-path>', 'select the bump root without an interactive picker'],
        ['--dry-run', 'render the plan without writing files'],
        ['--non-interactive', 'skip interactive confirmation once a root is known'],
      ],
    });
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
        return 'collecting workspace bump candidates...';
      case 'plan':
        return 'deriving affected downstream packages (topological)...';
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
    return `${c.cyan('•')} ${c.white(name)}  ${current}  ${path}`;
  },

  preflightRow(args) {
    const affected = args.selectedPaths.has(args.candidate.pkgPath);
    const { name, version } = args.candidate;
    const [modScope = '', ...modParts] = name.split('/');
    const modName = modParts.join('/');
    const pkg = affected
      ? `${c.gray(modScope)}/${c.white(c.bold(modName))}`
      : c.gray(`${modScope}/${modName}`);

    const bullet = affected ? c.cyan(' •') : c.gray(c.dim(' •'));
    const current = affected
      ? c.gray(Semver.toString(version.current))
      : c.gray(c.dim(Semver.toString(version.current)));
    const arrow = affected ? '→' : c.gray(c.dim('→'));
    const next = affected
      ? Semver.Fmt.colorize(version.next, { highlight: args.release })
      : c.gray(c.dim(Semver.toString(version.next)));

    return [`${bullet} ${pkg}`, current, arrow, next];
  },

  planSummary(args) {
    return [
      c.gray(`Selected root: ${c.white(args.plan.root.name)}`),
      c.gray(`Affected packages: ${c.white(String(args.plan.selected.length))}`),
    ];
  },

  dryRun() {
    return c.gray(c.italic('Dry run only. No files updated.'));
  },
};

/**
 * Helpers:
 */
const wrangle = {
  pad(value: string, width: number) {
    const visible = Cli.stripAnsi(value).length;
    return visible >= width ? value : `${value}${' '.repeat(width - visible)}`;
  },
} as const;
