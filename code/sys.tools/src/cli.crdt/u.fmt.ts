import NodeDocumentPositionEnum from 'happy-dom';
import { type t, Fmt as Base, c, Cli, D, pkg, Str, Time } from './common.ts';

export const Fmt = {
  ...Base,

  async help(toolname: string = D.toolname) {
    const table = Cli.table([]);

    const gr = c.gray;
    // table.push([gr(` ├─ ${pkg.name}`), pkg.version]);
    table.push([gr(` └─ ${pkg.name}`), pkg.version]);

    return Str.builder()
      .line()
      .line(c.gray(`${c.green(toolname)} `))
      .line(table.toString().trim())
      .line()
      .toString();
  },

  noDocuments(opts: { pad?: boolean } = {}) {
    const { pad = true } = opts;
    if (pad) console.info();
    console.info(c.gray(c.italic(' No documents are being watched')));
    if (pad) console.info();
  },

  itemTable(
    items: t.CrdtIndexItem[],
    opts: { sort?: boolean; appendColumn?: (e: t.CrdtIndexItem) => string | undefined | void } = {},
  ) {
    const { sort = true } = opts;
    const table = Cli.table([]);
    if (sort) items = items.sort((a, b) => a.addedAt - b.addedAt).toReversed();
    for (const item of items) {
      const docid = `${item.docid.slice(0, -5)}${c.green(item.docid.slice(-5))}`;
      const elapsed = Time.elapsed(item.addedAt);
      const col1 = c.gray(` • crdt:${docid}`);
      const col2 = c.gray(`added ${c.white(elapsed.toString())} ago`);
      const col3 = item.name ? c.cyan(Str.truncate(item.name.trim(), 25)) : '';
      const col4 = opts.appendColumn?.(item) ?? '';
      table.push([col1, col2, col3, col4].filter(Boolean));
    }
    return table.toString();
  },
} as const;
