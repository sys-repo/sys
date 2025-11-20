import { type t, Fmt as Base, c, Cli, D, Str, Time, getConfig } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.toolname, dir: t.StringDir) {
    const str = Str.builder()

      .line(await Base.help(toolname))
      .line(await Fmt.documentsTable(dir))
      .line();

    return String(str);
  },

  async documentsTable(dir: t.StringDir) {
    const table = Cli.table([]);
    const config = await getConfig(dir);
    const docs = config.current.docs ?? [];

    docs.forEach((item, i, total) => {
      const isLast = i === total.length - 1;
      let prefix = isLast ? '└─' : '├─';
      const document = c.gray(` ${prefix} ${c.white(item.name ?? '')}`);
      const id = c.gray(`${item.id.slice(0, -5)}${c.green(item.id.slice(-5))}`);
      table.push([document, id]);
    });

    const str = Str.builder()
      .line(c.gray('Documents:'))
      .line(Str.trimEdgeNewlines(String(table)));

    return String(str);
  },
} as const;
