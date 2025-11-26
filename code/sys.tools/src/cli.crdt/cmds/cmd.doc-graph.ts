import { type t, c, Cli, Crdt, D, Str } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { RepoProcess } from '../u.repo/mod.ts';

type Client = t.Crdt.Cmd.Client;

const Tree = Cli.Fmt.Tree;

export async function traverseDocumentGraph(root: t.Crdt.Id) {
  const port = D.port.repo;
  const cmd = await RepoProcess.tryClient(port);
  if (!cmd) return;

  const skipped: t.Crdt.Graph.WalkSkipArgs[] = [];
  const processed: t.Crdt.Id[] = [];
  const spinner = Cli.spinner();

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
    spinner.start(Fmt.spinnerText('walking graph...'));
    await walk(cmd);
    spinner.stop();
    await print(cmd);
  } finally {
    cmd.dispose?.(); // Release network resources.
  }

  /**
   * Print:
   */
  async function print(cmd: Client) {
    console.info(await buildProcessedTable(cmd, processed));
    if (skipped.length > 0) console.info(await buildNotFoundTable(skipped));
    console.info();
  }
}

/**
 * Helpers:
 */
async function buildProcessedTable(cmd: Client, processed: t.Crdt.Id[]) {
  const pipe = c.gray(`  ${Tree.vert}`);
  const ops = c.dim(c.gray('ops'));
  const changes = c.dim(c.gray('changes'));
  const table = Cli.table([pipe, '', ops, changes]);

  for (const [i, doc] of processed.entries()) {
    const is = { first: i === 0, last: i === processed.length - 1 } as const;
    const stats = await cmd.send('doc:stats', { doc });

    const uri = Fmt.prettyUri(doc);
    let identity = is.first ? uri : c.gray(uri);
    identity = `  ${c.dim(Tree.branch(is.last))} ${identity}`;

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

  return Str.trimEdgeNewlines(String(table));
}

async function buildNotFoundTable(skipped: t.Crdt.Graph.WalkSkipArgs[]) {
  if ((skipped ?? []).length === 0) return '';

  const warnTable = Cli.table([]);
  warnTable.push([c.gray(Tree.vert)]);
  skipped
    .filter((e) => e.reason === 'not-found')
    .forEach((e, i, totalCount) => {
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
