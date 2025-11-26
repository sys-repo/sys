import { type t, c, Cli, Crdt, D, Str } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { RepoProcess } from '../u.repo/mod.ts';

type Client = t.Crdt.Cmd.Client;

export async function traverseDocumentGraph(dir: t.StringDir, root: t.Crdt.Id) {
  const cmd = await RepoProcess.tryClient(D.port);
  if (!cmd) return;
  const processed: t.Crdt.Id[] = [];

  /**
   * Print:
   */
  async function buildTable(cmd: Client) {
    const table = Cli.table();
    for (const [i, doc] of processed.entries()) {
      const stats = await cmd.send('doc:stats', { doc });

      const uri = Fmt.prettyUri(doc);
      const identity = i === 0 ? uri : c.gray(uri);

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

    return String(table);
  }

  async function print(cmd: Client) {
    const tbl = await buildTable(cmd);
    console.info(tbl);
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
    await walk(cmd);
    await print(cmd);
  } finally {
    cmd.dispose?.(); // Release network resources.
  }

  return;
}
