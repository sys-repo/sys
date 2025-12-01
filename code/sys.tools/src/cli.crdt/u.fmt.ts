import { type t, Fmt as Base, Fs, c, Cli, Crdt, D, getConfig, Json, Str, Time } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.toolname, cwd: t.StringDir) {
    const str = Str.builder()
      .line(await Base.help(toolname))
      .line(await Fmt.Table.configuredDocs(cwd))
      .line();

    return String(str);
  },

  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  prettyUri(input: t.Crdt.Id) {
    const id = Crdt.Id.clean(input) ?? input;
    const pretty = `${id.slice(0, -5)}${c.green(id.slice(-5))}`;
    return `crdt:${pretty}`;
  },

  printDocConfig(config: t.CrdtTool.ConfigDoc, doc: t.Crdt.Id) {
    const str = Str.builder();
    const uri = Fmt.prettyUri(doc);
    const item = (config.docs ?? []).find((d) => d.id === doc);

    const configFor = `  Configuration for ${uri}`;
    if (!item) {
      str.line().line(c.yellow(`${configFor} not found.`));
    } else {
      const json = Json.stringify(item);
      str
        .line()
        .line(c.gray(`${configFor}:`))
        .line()
        .line(c.italic(c.yellow(Str.indent(json, 4))));
    }

    return String(str.line());
  },

  Table: {
    async configuredDocs(dir: t.StringDir) {
      const table = Cli.table([]);
      const config = await getConfig(dir);
      const docs = config.current.docs ?? [];

      const now = Time.now.timestamp;
      docs.forEach((item, i, total) => {
        const branch = Fmt.Tree.branch([i, total]);
        const document = c.gray(` ${branch} ${c.white(item.name ?? '')}`);
        const id = c.gray(`crdt:${item.id.slice(0, -5)}${c.green(item.id.slice(-5))}`);
        const elapsed = item.createdAt ? Time.elapsed(item.createdAt, now) : undefined;
        const age = c.gray(elapsed?.toString() || '-');
        table.push([document, id, age]);
      });

      const empty = docs.length > 0 ? '' : c.italic(c.dim('  (no documents added)'));
      const str = Str.builder()
        .line(c.gray('Tracking:'))
        .line(empty || Str.trimEdgeNewlines(String(table)));

      return String(str);
    },

    docsGraphNotFound() {},
  },
} as const;
