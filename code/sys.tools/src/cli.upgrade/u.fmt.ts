import { c, Cli, Pkg, pkg, Str, type t } from './common.ts';
import { rootAdvisoryPrelude } from './u.advisory.fmt.ts';

type HelpInput =
  | Omit<t.CliFormatHelpInputSections, 'tool'>
  | Omit<t.CliFormatHelpInputShorthand, 'tool'>;

const g = c.green;
const w = c.white;

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
        ['-l, --latest', 'Refresh the local Deno cache for the current Deno-actionable version.'],
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
    const actionable = version.actionable;
    const upgradeAvailable = version.is.upgradeAvailable ?? !version.is.latest;
    const resolverUnavailable = version.is.resolverUnavailable ?? version.resolution?.ok === false;
    const upToDate = !upgradeAvailable && !version.is.pending && !resolverUnavailable;
    const formatVersion = (v: t.StringSemver | undefined, kind: 'local' | 'latest') => {
      if (!v) return c.gray('-');
      if (upToDate) return c.green(`${v} ✔`);
      return kind === 'local' ? c.gray(v) : c.white(v);
    };
    const table = Cli.table([]);

    const remote = formatVersion(version.remote, 'latest');
    const local = formatVersion(version.local, 'local');
    const upgradeReq = upgradeAvailable ? c.gray('← (upgrade available)') : '';

    table.push([c.gray('Package'), pkg.name]);
    table.push([c.gray('  local'), `${local}     ${upgradeReq}`.trim()]);
    table.push([c.gray(`  latest`), remote]);
    if (resolverUnavailable) {
      table.push([c.gray(`  actionable`), c.gray('unverified')]);
    } else if (actionable && actionable !== version.remote) {
      table.push([c.gray(`  actionable`), c.white(actionable)]);
    }
    return Str.trimEdgeNewlines(String(table));
  },

  localVersionIsMostRecent(version: t.UpgradeTool.VersionInfo) {
    const str = Str.builder();
    str
      .line(`Local version ${g(version.local)} of ${w(pkg.name)} is the most recent release`)
      .line(c.italic(c.dim(`No upgrade required`)));
    return c.gray(String(str));
  },

  upgradePending(version: t.UpgradeTool.VersionInfo) {
    const actionable = version.actionable ?? version.latest;
    const str = Str.builder();
    str
      .line(`Published version ${w(version.remote)} of ${w(pkg.name)} is not currently actionable`)
      .line(`Deno currently resolves ${w(pkg.name)} to ${g(actionable)}`)
      .line(c.italic(c.dim(`Upgrade pending under Deno resolver policy`)));
    return c.gray(String(str));
  },

  upgradeResolverUnavailable(version: t.UpgradeTool.VersionInfo) {
    const reason = version.resolution?.ok === false ? version.resolution.reason.code : 'unknown';
    const str = Str.builder();
    str
      .line(`Could not verify Deno-actionable ${w(pkg.name)} version`)
      .line(`Published latest is ${w(version.remote)}; cache refresh was not run`)
      .line(c.italic(c.dim(`Resolver state unavailable: ${reason}`)));
    return c.gray(String(str));
  },

  rootAdvisoryPrelude,
} as const;
