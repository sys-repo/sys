import { c, Cli, Jsr, Pkg, pkg, Str, type t } from './common.ts';
import { rootAdvisoryPrelude } from './u.advisory.fmt.ts';
import { StanddownTiming } from './u.standdown.ts';
import { toVersionState } from './u.versionState.ts';

type HelpInput =
  | Omit<t.Cli.Fmt.Help.InputSections, 'tool'>
  | Omit<t.Cli.Fmt.Help.InputShorthand, 'tool'>;

const g = c.green;
const w = c.white;

type DisplayRow = { readonly label: string; readonly value: string };
type DisplayState = { readonly title: string; readonly rows: readonly DisplayRow[] };

function displayState(version: t.UpgradeTool.VersionInfo): DisplayState {
  const state = toVersionState(version);
  const installable = state.actionable ?? version.latest;

  if (state.upgradeAvailable) {
    return {
      title: w(`${pkg.name} upgrade available`),
      rows: [
        { label: 'current', value: c.gray(version.local) },
        { label: 'published', value: publishedValue(version, state) },
        { label: 'installable', value: g(installable) },
      ],
    };
  }

  if (state.pending) {
    return {
      title: w(`${pkg.name} auto-upgrade pending — standing down`),
      rows: [
        { label: 'current', value: c.gray(version.local) },
        { label: 'published', value: w(version.remote) },
        { label: 'installable', value: c.gray(c.italic('none yet')) },
      ],
    };
  }

  if (state.resolverUnavailable) {
    return {
      title: w(`${pkg.name} upgrade check unavailable`),
      rows: [
        { label: 'current', value: c.gray(version.local) },
        { label: 'published', value: w(version.remote) },
        { label: 'installable', value: c.gray(c.italic('unknown')) },
      ],
    };
  }

  return {
    title: w(`${pkg.name} is up to date`),
    rows: [
      { label: 'current', value: g(version.local) },
      { label: 'published', value: g(`${version.remote} ✔`) },
    ],
  };
}

function publishedValue(
  version: t.UpgradeTool.VersionInfo,
  state: t.UpgradeTool.VersionState,
): string {
  const base = w(version.remote);
  const standdown = state.minimumDependencyAgeStanddown;
  if (!standdown) return base;

  const duration = StanddownTiming.formatDuration(standdown.remaining);
  return `${base}  ${c.gray(c.italic(`— minimum dependency age window clears in ${duration}`))}`;
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
  ): t.Cli.Fmt.Help.Input {
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
    const b = c.gray(`# ↑ equiv: deno cache --reload --no-config --no-lock jsr:@sys/tools`);
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
    const registryUrl = c.gray(c.dim(Jsr.Url.Pkg.web(pkg.name)));
    const str = Str.builder().line(state.title).line();
    const labelWidth = state.rows.reduce((max, row) => Math.max(max, row.label.length), 0);

    for (const row of state.rows) {
      str.line(`  ${c.gray(row.label.padEnd(labelWidth))}  ${row.value}`);
    }

    str.line(`  ${registryUrl}`);
    return Str.trimEdgeNewlines(String(str));
  },

  localVersionIsMostRecent(_version: t.UpgradeTool.VersionInfo) {
    return c.gray(c.italic('No upgrade needed.'));
  },

  upgradePending(version: t.UpgradeTool.VersionInfo) {
    const state = toVersionState(version);
    const str = Str.builder().line(c.gray('No upgrade was run.'));

    if (state.reason?.code === 'policy:minimum-dependency-age') {
      const waiting = `${StanddownTiming.formatWait(state.minimumDependencyAgeStanddown?.remaining)}.`;
      str.line(c.gray(c.italic(waiting)));
    } else {
      str.line(c.gray('Published version is not currently installable.'));
    }

    return str.toString();
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
