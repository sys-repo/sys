import { type t, Is, c, Str, Cli, D, Time, Yaml, Obj } from '../common.ts';
import { RepoProcess } from '../cmd.daemon.repo/mod.ts';
import { Fmt } from '../u.fmt.ts';

type O = Record<string, unknown>;

export async function lintDocumentGraph(cwd: t.StringDir, docid: t.Crdt.Id, path?: t.ObjectPath) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  const str = Str.builder();
  const table = Cli.table();
  table.push([c.bold(c.cyan('Lint'))]);
  table.push([c.gray('Root Document:'), Fmt.prettyUri(docid)]);
  table.push([c.gray(`Yaml Path:`), path ? `/${path.join('/')}` : '-']);

  str
    //
    .line(String(table))
    .line()
    .line(c.dim('🐷'.repeat(30)))
    .line()
    .line(c.yellow(c.italic(`    TODO Lint Document Graph`)))
    .line(c.yellow(c.italic(`    - walk graph`)))
    .line(c.yellow(c.italic(`    - run normalizers (eg. check/resolve paths)`)))
    .line(c.yellow(c.italic(`    - check alias: ← @sys/std/alias: ResolveAlias`)))
    .line(c.yellow(c.italic(`    - clean knowns data-structure shapes`)))
    .line(c.yellow(c.italic(`    - `)))
    .line(c.yellow(c.italic(`    - `)))
    .line();

  console.info(String(str));
}
