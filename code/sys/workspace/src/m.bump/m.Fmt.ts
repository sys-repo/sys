import { c, Cli, type t } from './common.ts';
import { Semver } from '@sys/std/semver/server';

export const Fmt: t.WorkspaceBump.Fmt.Lib = {
  help() {
    Cli.Fmt.Help.render({
      tool: 'deno task bump',
      summary: 'Bump workspace packages from one or more selected topological roots.',
      note: 'Interactive by default; repeat `--from` for scripted multi-root bumps.',
      usage: [
        'deno task bump',
        'deno task bump -- --release minor',
        'deno task bump -- --from=@scope/pkg --from=code/sys/fs --non-interactive --dry-run',
      ],
      options: [
        ['-h, --help', 'show help'],
        ['--release <patch|minor|major>', 'choose the semver bump kind (default: patch)'],
        [
          '--from <package-name|package-path>',
          'select bump roots without the interactive picker (repeatable)',
        ],
        ['--dry-run', 'render the plan without writing files'],
        ['--non-interactive', 'skip interactive confirmation once bump roots are known'],
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
    const roots = args.plan.roots.map((root) => root.name);
    const selectedRoots = roots.length === 1
      ? c.gray(`Selected root: ${c.white(roots[0]!)}`)
      : c.gray(
        `Selected roots: ${c.white(String(roots.length))} ${c.dim(`(${wrangle.list(roots)})`)}`,
      );
    return [
      selectedRoots,
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

  list(values: readonly string[]) {
    if (values.length <= 3) return values.join(', ');
    const head = values.slice(0, 3).join(', ');
    return `${head}, +${values.length - 3} more`;
  },
} as const;
