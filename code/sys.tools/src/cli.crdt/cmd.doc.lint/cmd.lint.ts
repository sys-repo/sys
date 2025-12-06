import { buildDocumentDAG } from '../cmd.doc.graph/mod.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, AliasResolver, c, Cli, D, Fs, Is, Str } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

type O = Record<string, unknown>;

export async function lintDocumentGraphCommand(
  cwd: t.StringDir,
  docid: t.Crdt.Id,
  yamlPath: t.ObjectPath,
) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  const dag = await buildDocumentDAG(cmd, docid, yamlPath);

  console.info();
  console.info(c.cyan(`🐷 Lint:`), Fmt.prettyUri(docid));
  console.info();
  console.info(dag);
  console.info();

  // Derive root-level :index alias resolver (for second-hop resolution).
}
