import { buildDocumentDAG } from '../cmd.doc.graph/mod.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, c, D } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

type O = Record<string, unknown>;

export async function documentGraphTasksCommand(
  cwd: t.StringDir,
  docid: t.Crdt.Id,
  yamlPath: t.ObjectPath,
) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  const dag = await buildDocumentDAG(cmd, docid, yamlPath);
  console.info();
  console.info(c.cyan(`🐷 Tasks:`), Fmt.prettyUri(docid));
  console.info();

  const m =
    (await import('../../../-tmp.prog/mod.ts')) as typeof import('../../../-tmp.prog/mod.ts');

  const res = await m.tasks(dag, yamlPath);

  console.log(`-------------------------------------------`);
  console.log('tasks 🐷', res);
}
