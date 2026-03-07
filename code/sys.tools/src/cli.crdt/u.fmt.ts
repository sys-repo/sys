import { type t, Fmt as Base, c, Cli, Crdt, D, Str } from './common.ts';
import { CrdtDocsFs } from './u.config.docs/u.fs.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.tool.name, cwd: t.StringDir) {
    const str = Str.builder()
      .line(await Base.help(toolname))
      .line(await Fmt.Table.configuredDocs(cwd))
      .line();

    return String(str);
  },

  prettyUri(input: t.Crdt.Id) {
    const id = Crdt.Id.clean(input) ?? input;
    const pretty = `${id.slice(0, -5)}${c.green(id.slice(-5))}`;
    return `crdt:${pretty}`;
  },

  Table: {
    async configuredDocs(dir: t.StringDir) {
      const table = Cli.table([]);
      const files = await CrdtDocsFs.list(dir);
      const entries: Array<{ id: t.StringId; name?: t.StringName }> = [];

      for (const path of files) {
        const checked = await CrdtDocsFs.readYaml(path);
        if (!checked.ok) continue;
        entries.push({ id: checked.doc.id, name: checked.doc.name });
      }

      entries.forEach((item, i, total) => {
        const branch = Fmt.Tree.branch([i, total]);
        const document = c.gray(` ${branch} ${c.white(item.name ?? '')}`);
        const id = c.gray(`crdt:${item.id.slice(0, -5)}${c.green(item.id.slice(-5))}`);
        const age = c.gray('-');
        table.push([document, id, age]);
      });

      const empty = entries.length > 0 ? '' : c.italic(c.dim('  (no documents added)'));
      const str = Str.builder()
        .line(c.gray('Tracking:'))
        .line(empty || Str.trimEdgeNewlines(String(table)));

      return String(str);
    },

    docsGraphNotFound() {},
  },
} as const;
