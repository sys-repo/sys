import { type t, Fmt as Base, c, Cli, D, Fs, Str, Time } from './common.ts';
import { getConfig } from './u.config.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    const config = await getConfig(cwd);

    const str = Str.builder()
      .line(c.gray(`working dir: ${Fs.trimCwd(cwd)}`))
      .line(await Base.help(toolname))
      .line();

    return String(str);
  },

  endpointTable(ref: t.DeployTool.Config.EndpointRef) {
    const table = Cli.table();

    const fmtTime = (ts?: t.UnixTimestamp) => {
      if (!ts) return c.gray(c.dim('-'));
      try {
        return c.gray(`${String(Time.elapsed(ts))} ago`);
      } catch {
        return c.gray(String(ts));
      }
    };

    const child = (label: string, isLast = false) => {
      return c.gray(` ${c.dim(Fmt.Tree.branch(isLast))} ${label}`);
    };

    table.body([
      [c.gray(`Endpoint`), c.cyan(ref.name)],
      [child(`file`), c.gray(c.dim(ref.file))],
      [child(`created`), fmtTime(ref.createdAt)],
      [child(`last used`, true), fmtTime(ref.lastUsedAt)],
    ]);

    return Str.trimEdgeNewlines(String(table));
  },
} as const;
