import { type t, Crdt, c, Cli, Str, Time } from '../common.ts';
import { Fmt as Base } from '../u.fmt.ts';

const Tree = Cli.Fmt.Tree;
type Client = t.Crdt.Cmd.Client;

export const Fmt = {
  ...Base,

  async buildProcessedTable(cmd: Client, processed: t.Crdt.Id[], startedAt: t.Msecs) {
    const pipe = c.dim(c.gray(`  ${Tree.vert}`));
    const ops = c.dim(c.gray('ops'));
    const changes = c.dim(c.gray('changes'));
    const table = Cli.table([pipe, '', ops, changes]);
    const branch = c.dim(c.gray(Tree.branch(false)));

    for (const [i, doc] of processed.entries()) {
      const is = { first: i === 0, last: i === processed.length - 1 } as const;
      const stats = await cmd.send('doc:stats', { doc });

      const uri = Fmt.prettyUri(doc);
      let identity = is.first ? uri : c.gray(uri);
      identity = `  ${branch} ${identity}`;

      const warnAt = 1024 * 1024; // 1MB
      const bytes = (bytes: number) => {
        const s = Str.bytes(bytes);
        return bytes > warnAt ? c.yellow(s) : s;
      };

      const total = stats.total;
      const size = bytes(stats.bytes);

      const changes = c.gray(total.changes.toLocaleString());
      const ops = c.gray(total.ops.toLocaleString());
      table.push([identity, size, ops, changes]);
    }

    const elapsed = String(Time.elapsed(startedAt));
    const total = processed.length;
    let summary = `walked ${c.white(String(total))}`;
    summary += ` ${Str.plural(total, 'document', 'documents')} in ${elapsed}`;
    table.push([c.dim(c.gray(`  ${Tree.vert}`))]);
    table.push([c.gray(`  ${c.italic(summary)}`)]);

    return Str.trimEdgeNewlines(String(table));
  },

  async buildNotFoundTable(skipped: t.Crdt.Graph.WalkSkipArgs[]) {
    skipped = skipped.filter((e) => e.reason === 'not-found');
    if ((skipped ?? []).length === 0) return '';

    const table = Cli.table([]);
    table.push([c.gray(Tree.vert)]);
    skipped.forEach((e, i, totalCount) => {
      const branch = Tree.branch([i, totalCount]);
      const skipped = c.gray(`${c.yellow('skipped')}; ${e.reason}, depth=${e.depth}`);
      table.push([c.gray(`${branch} ${Fmt.prettyUri(e.id)}`), skipped]);
    });

    const notFound = c.white('not found');
    const str = Str.builder()
      .line()
      .line(c.gray(`${c.yellow('Warning')} the following linked documents were ${notFound}:`))
      .line(Str.trimEdgeNewlines(String(table)))
      .line();

    return String(str);
  },

  buildHookOutputTable(items: t.DocumentGraphHookLog[]) {
    if (items.length === 0) return '';
    const table = Cli.table().padding(1);

    items.forEach((e) => {
      const out = String(e.log);
      if (!out) return;

      const depth = c.dim(`depth=${e.depth}`);
      const title = c.gray(`${Fmt.prettyUri(e.id)} ${depth}`);
      table.push(['🐷', title]);
      table.push(['', out]);
      table.push([]);
    });

    const str = Str.builder()
      .line()
      .line(Str.trimEdgeNewlines(String(table)))
      .line();
    return String(str);
  },
};
