import { type t, c, Cli, Crdt, D, Str, Time } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';

type Client = t.Crdt.Cmd.Client;

const Tree = Cli.Fmt.Tree;

export async function traverseDocumentGraph(root: t.Crdt.Id) {
  const port = D.port.repo;
  const cmd = await RepoProcess.tryClient(port);
  if (!cmd) return;

  const spinner = Cli.spinner();
  const skipped: t.Crdt.Graph.WalkSkipArgs[] = [];
  const processed: t.Crdt.Id[] = [];

  /**
   * Process (walk the graph)
   */
  async function walk(cmd: Client) {
    await Crdt.Graph.walk({
      id: root,
      processed,
      async load(id) {
        const { doc } = await cmd.send('doc:current', { doc: id });
        return doc ?? undefined;
      },
      async onDoc(e) {},
      onSkip: (e) => skipped.push(e),
      onRefs(e) {},
    });
  }

  try {
    const startedAt = Time.now.timestamp;
    spinner.start(Fmt.spinnerText('walking graph...'));
    await walk(cmd);
    spinner.stop();
    await print(cmd, startedAt);
  } finally {
    cmd.dispose?.(); // Release network resources.
  }

  /**
   * Print:
   */
  async function print(cmd: Client, startedAt: t.Msecs) {
    console.info(await buildProcessedTable(cmd, processed, startedAt));
    if (skipped.length > 0) console.info(await buildNotFoundTable(skipped));
    console.info();
  }
}

/**
 * Helpers:
 */
async function buildProcessedTable(cmd: Client, processed: t.Crdt.Id[], startedAt: t.Msecs) {
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

    const warnAt = 1024 * 1024; // 1-MB
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
  let summary = `walked ${total}`;
  summary += ` ${Str.plural(total, 'document', 'documents')} in ${elapsed}`;
  table.push([c.dim(c.gray(`  ${Tree.vert}`))]);
  table.push([c.gray(`  ${c.italic(summary)}`)]);

  return Str.trimEdgeNewlines(String(table));
}

async function buildNotFoundTable(skipped: t.Crdt.Graph.WalkSkipArgs[]) {
  skipped = skipped.filter((e) => e.reason === 'not-found');
  if ((skipped ?? []).length === 0) return '';

  const warnTable = Cli.table([]);
  warnTable.push([c.gray(Tree.vert)]);
  skipped.forEach((e, i, totalCount) => {
    const branch = Tree.branch([i, totalCount]);
    const skipped = c.gray(`${c.yellow('skipped')}; ${e.reason}, depth=${e.depth}`);
    warnTable.push([c.gray(`${branch} ${Fmt.prettyUri(e.id)}`), skipped]);
  });

  const notFound = c.white('not found');
  const str = Str.builder()
    .line()
    .line(c.gray(`${c.yellow('Warning')} the following linked documents were ${notFound}:`))
    .line(Str.trimEdgeNewlines(String(warnTable)))
    .line();

  return String(str);
}
