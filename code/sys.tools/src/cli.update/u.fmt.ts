import { type t, Fmt as Base, c, Cli, D, pkg, Str } from './common.ts';
import { getVersionInfo } from './u.ts';

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
    const formatVersion = (v?: t.StringSemver) => {
      if (!v) return c.gray('-');
      return v === version.latest ? c.green(v) : c.yellow(v);
    };
    const table = Cli.table([]);
    table.push([c.gray('Package'), pkg.name]);
    table.push([c.gray('  local'), formatVersion(version.local)]);
    table.push([c.gray('  remote'), formatVersion(version.remote)]);
    return Str.trimEdgeNewlines(String(table));
  },

  localVersionIsMostRecent(version: t.UpdateVersionInfo) {
    const msg = `Local version ${c.green(version.local)} of ${c.white(pkg.name)} is the most recent release`;
    return c.gray(msg);
  },
} as const;
