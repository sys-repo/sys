import { c, Cli, Pkg, pkg, Semver, Str, type t } from './common.ts';
import { rootAdvisoryPrelude } from './u.advisory.fmt.ts';

type HelpInput =
  | Omit<t.CliFormatHelpInputSections, 'tool'>
  | Omit<t.CliFormatHelpInputShorthand, 'tool'>;

const g = c.green;
const w = c.white;

type DisplayRow = { readonly label: string; readonly value: string };
type DisplayState = { readonly title: string; readonly rows: readonly DisplayRow[] };

function displayState(version: t.UpgradeTool.VersionInfo): DisplayState {
  const hasNewerRelease = Semver.Is.greaterThan(version.remote, version.local);
  const resolverUnavailable = hasNewerRelease &&
    (version.is.resolverUnavailable ?? version.resolution?.ok === false);
  const upgradeAvailable = hasNewerRelease && !resolverUnavailable &&
    (version.is.upgradeAvailable ?? !version.is.latest);
  const standingDown = !upgradeAvailable && hasNewerRelease && (version.is.pending ?? false);
  const upgrade = version.actionable ?? version.latest;

  if (upgradeAvailable) {
    const rows: DisplayRow[] = [{ label: 'running', value: c.gray(version.local) }];
    if (version.remote !== upgrade) rows.push({ label: 'latest', value: w(version.remote) });
    rows.push({ label: 'upgrade', value: g(upgrade) });
    return { title: w(`${pkg.name} upgrade available`), rows };
  }

  if (standingDown) {
    return {
      title: w(`${pkg.name} upgrade standing down`),
      rows: [
        { label: 'running', value: c.gray(version.local) },
        { label: 'latest', value: w(version.remote) },
        { label: 'held at', value: c.gray(upgrade) },
      ],
    };
  }

  if (resolverUnavailable) {
    return {
      title: w(`${pkg.name} upgrade check unavailable`),
      rows: [
        { label: 'running', value: c.gray(version.local) },
        { label: 'latest', value: w(version.remote) },
      ],
    };
  }

  return {
    title: w(`${pkg.name} is up to date`),
    rows: [
      { label: 'running', value: g(version.local) },
      { label: 'latest', value: g(`${version.remote} ✔`) },
    ],
  };
}

export const Fmt = {
  Tree: Cli.Fmt.Tree,

  invoke(...parts: string[]) {
    return ['deno run -A jsr:@sys/tools', ...parts].join(' ').trim();
  },

  async header(toolname: string, opts: { readonly exitHint?: boolean } = {}) {
    const { exitHint = true } = opts;
    let identity = c.gray(`${c.green(toolname)} v${pkg.version}`);
    if (exitHint) identity += c.gray(c.dim(` (Ctrl-C to exit)`));
    return identity;
  },

  signoff(toolname: string) {
    const self = `${Pkg.toString(pkg)}:${toolname}`;
    return Str.builder()
      .line(c.dim(c.gray(self)))
      .toString();
  },

  helpInput(
    toolname: string,
    input: HelpInput = {},
  ): t.CliFormatHelpInput {
    if ('sections' in input && input.sections) {
      return {
        tool: toolname,
        summary: input.summary ?? `${pkg.name} v${pkg.version}`,
        note: input.note,
        sections: input.sections,
      };
    }

    return {
      tool: toolname,
      summary: input.summary ?? `${pkg.name} v${pkg.version}`,
      note: input.note,
      usage: input.usage,
      options: input.options,
      examples: input.examples,
    };
  },

  async help() {
    const str = Str.builder();
    const base = await Cli.Fmt.Help.build(Fmt.helpInput(Fmt.invoke('upgrade'), {
      note: `@sys/tools/${c.white('upgrade')}`,
      usage: [
        Fmt.invoke('upgrade'),
        Fmt.invoke('upgrade --latest'),
      ],
      options: [
        ['-l, --latest', 'Refresh @sys/tools if an upgrade is available.'],
        ['-h, --help', 'Show this help.'],
      ],
    }));
    str.line(base).line(Fmt.shellcommand()).line();
    return String(str);
  },

  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  back(opts: { readonly indent?: string; readonly label?: string } = {}) {
    const { indent = '', label = 'back' } = opts;
    return `${indent}${c.cyan('←')} ${c.gray(c.dim(label))}`;
  },

  shellcommand() {
    const str = Str.builder();
    const a = c.yellow(`sys upgrade --latest ${c.gray('[-l]')}`);
    const b = c.gray(`# ↑ equiv: deno cache --reload jsr:@sys/tools`);
    str
      .line(c.gray('To upgrade to latest run:'))
      .line()
      .line(c.italic(`  ${a}`))
      .line(c.italic(`  ${b}`))
      .line();
    return String(str);
  },

  versionInfoTable(version: t.UpgradeTool.VersionInfo) {
    const state = displayState(version);
    const str = Str.builder().line(state.title).line();
    const labelWidth = state.rows.reduce((max, row) => Math.max(max, row.label.length), 0);

    for (const row of state.rows) {
      str.line(`  ${c.gray(row.label.padEnd(labelWidth))}  ${row.value}`);
    }

    return Str.trimEdgeNewlines(String(str));
  },

  localVersionIsMostRecent(_version: t.UpgradeTool.VersionInfo) {
    return c.gray('No upgrade needed.');
  },

  upgradePending(_version: t.UpgradeTool.VersionInfo) {
    return c.gray(
      Str.builder()
        .line('No upgrade was run.')
        .line('Deno is not allowing this upgrade yet.')
        .toString(),
    );
  },

  upgradeResolverUnavailable(_version: t.UpgradeTool.VersionInfo) {
    return c.gray(
      Str.builder()
        .line('No upgrade was run.')
        .line('Could not complete the upgrade check.')
        .toString(),
    );
  },

  rootAdvisoryPrelude,
} as const;
