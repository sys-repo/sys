import { type t, c, Cli, Crdt, D, Str } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { RepoProcess } from '../u.repo/mod.ts';

type Client = t.Crdt.Cmd.Client;

const Tree = Cli.Fmt.Tree;

export async function traverseDocumentGraph(dir: t.StringDir, root: t.Crdt.Id) {
  const port = D.port.repo;
  const cmd = await RepoProcess.tryClient(port);
  if (!cmd) return;

  const processed: t.Crdt.Id[] = [];
  const spinner = Cli.spinner();

  /**
   * Print:
   */
  async function buildTable(cmd: Client) {
    const table = Cli.table([c.gray(' •'), '', c.dim(c.gray('ops')), c.dim(c.gray('changes'))]);
    for (const [i, doc] of processed.entries()) {
      const is = { first: i === 0, last: i === processed.length - 1 } as const;
      const stats = await cmd.send('doc:stats', { doc });

      const uri = Fmt.prettyUri(doc);
      let identity = is.first ? uri : c.gray(uri);
      identity = ` ${c.dim(Tree.branch(is.last))} ${identity}`;

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

  async function print(cmd: Client) {
    const tbl = await buildTable(cmd);
    console.info(tbl);
    console.info();
  }

  /**
   * Process (walk the graph)
   */
  async function walk(cmd: Client) {
    await Crdt.Graph.walk({
      id: root,
      processed,
      load: async (id) => {
        const { doc } = await cmd.send('doc:get', { doc: id });
        return doc ?? undefined;
      },
      async onDoc(e) {
      },
      onSkip(e) {
      },
      onRefs(e) {
      },
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

  return;
}
