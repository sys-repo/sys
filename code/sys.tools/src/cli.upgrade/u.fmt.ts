import { c, Cli, pkg, Pkg, Str, type t } from './common.ts';
import { getVersionInfo } from './u.ts';

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
    const version = await getVersionInfo();
    const base = await Cli.Fmt.Help.build(Fmt.helpInput(Fmt.invoke('upgrade'), {
      note: `@sys/tools/${c.white('upgrade')}`,
    }));
    str.line(base).line(Fmt.versionInfoTable(version)).line();
    if (!version.is.latest) str.line(Fmt.shellcommand()).line();
    if (version.is.latest) str.line(Fmt.localVersionIsMostRecent(version)).line();
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
    const formatVersion = (v: t.StringSemver | undefined, kind: 'local' | 'latest') => {
      if (!v) return c.gray('-');
      if (version.is.latest) return c.green(`${v} ✔`);
      return kind === 'local' ? c.gray(v) : c.white(v);
    };
    const table = Cli.table([]);

    const upToDate = version.is.latest;
    const remote = formatVersion(version.remote, 'latest');
    const local = formatVersion(version.local, 'local');
    const upgradeReq = upToDate ? '' : c.gray('← (upgrade available)');

    table.push([c.gray('Package'), pkg.name]);
    table.push([c.gray('  local'), `${local}     ${upgradeReq}`.trim()]);
    table.push([c.gray(`  latest`), remote]);
    return Str.trimEdgeNewlines(String(table));
  },

  localVersionIsMostRecent(version: t.UpgradeTool.VersionInfo) {
    const str = Str.builder();
    str
      .line(`Local version ${g(version.local)} of ${w(pkg.name)} is the most recent release`)
      .line(c.italic(c.dim(`No upgrade required`)));
    return c.gray(String(str));
  },

  rootAdvisoryPrelude(remote?: t.StringSemver) {
    const { gray: g, white: w, magenta: m } = c;
    const hr = c.green(Cli.Fmt.hr());
    const width = Cli.stripAnsi(hr).length;
    const message = `${g('Run ')}${w('sys upgrade ')}${m('--latest')}`;
    const latest = remote ? `${g('next available ')}${w(remote)}` : undefined;

    return Str.builder()
      .line(hr)
      .line(wrangle.rootAdvisoryLine({ width, message, latest }))
      .line(hr)
      .toString();
  },
} as const;

const wrangle = {
  rootAdvisoryLine(args: { width: number; message: string; latest?: string }) {
    const { width, message, latest } = args;
    if (!latest) return message;

    const left = Cli.stripAnsi(message).length;
    const right = Cli.stripAnsi(latest).length;
    const spaces = width - left - right;
    if (spaces < 2) return message;
    return `${message}${' '.repeat(spaces)}${latest}`;
  },
} as const;
