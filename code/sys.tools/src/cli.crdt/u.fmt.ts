import { type t, Fmt as Base, c, Cli, Crdt, D, getConfig, Str, Time } from './common.ts';

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

  spinnerText(text: string) {
    return c.italic(c.gray(text));
  },

  prettyUri(input: t.Crdt.Id) {
    const id = Crdt.Id.clean(input) ?? input;
    const pretty = `${id.slice(0, -5)}${c.green(id.slice(-5))}`;
    return Crdt.Is.uri(input) ? `crdt:${pretty}` : pretty;
  },
} as const;
