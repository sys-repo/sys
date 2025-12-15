import { type t, Fmt as Base, c, Cli, D, pkg, Str } from './common.ts';
import { getVersionInfo } from './u.ts';

const g = c.green;
const w = c.white;

export const Fmt = {
  ...Base,

  async help(toolname: string = D.toolname) {
    const str = Str.builder();
    const version = await getVersionInfo();
    const base = await Base.help(toolname, (e) => e.row(c.gray(`@sys/tools/${c.white('update')}`)));
    str.line(base).line(Fmt.versionInfoTable(version)).line();
    if (!version.is.latest) str.line(Fmt.shellcommand()).line();
    if (version.is.latest) str.line(c.italic(Fmt.localVersionIsMostRecent(version))).line();

    return String(str);
  },

  shellcommand() {
    const str = Str.builder();
    const a = c.yellow(`sys update --latest ${c.gray('[-l]')}`);
    const b = c.gray(`# ↑ equiv: deno cache --reload jsr:@sys/tools`);
    str
      .line(c.gray('To update to latest run:'))
      .line()
      .line(c.italic(`  ${a}`))
      .line(c.italic(`  ${b}`))
      .line();
    return String(str);
  },

  versionInfoTable(version: t.UpdateVersionInfo) {
    const formatVersion = (v?: t.StringSemver, upToDate?: boolean, okSuffix = '') => {
      if (!v) return c.gray('-');
      return v === version.latest ? c.green(`${v} ${upToDate ? okSuffix : ''}`) : c.yellow(v);
    };
    const table = Cli.table([]);

    const upToDate = version.is.latest;
    const remote = formatVersion(version.remote, upToDate);
    const local = formatVersion(version.local, upToDate, '✔');
    const updateReq = upToDate ? '' : c.gray(`← ${c.italic(c.yellow('(update available)'))}`);

    table.push([c.gray('Package'), pkg.name]);
    table.push([c.gray(`  latest`), remote]);
    table.push([c.gray('  local'), `${local}     ${updateReq}`.trim()]);
    return Str.trimEdgeNewlines(String(table));
  },

  localVersionIsMostRecent(version: t.UpdateVersionInfo) {
    const str = Str.builder();
    str
      .line(`No update required`)
      .line(`Local version ${g(version.local)} of ${w(pkg.name)} is the most recent release`);
    return c.gray(String(str));
  },
} as const;
