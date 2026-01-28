import { buildDocumentDAG } from '../cmd.doc.graph/mod.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, c, D } from '../common.ts';
import { Fmt } from '../u.fmt.ts';

type O = Record<string, unknown>;

export type LintResult = {
  readonly ok: boolean;
};

export async function lintDocumentGraphCommand(
  cwd: t.StringDir,
  docid: t.Crdt.Id,
  yamlPath: t.ObjectPath,
) {
  const port = D.port.repo;
  const cmd = await RepoProcess.tryClient(port);
  if (!cmd) return;

  /** Build document graph (DAG) for the given YAML path. */
  const dag = await buildDocumentDAG(cmd, docid, yamlPath);
  console.info();
  console.info(c.cyan(`Lint Document Graph:`), Fmt.prettyUri(docid));
  console.info();

  const { Linter } = await import('@tdb/edu-slug/compiler');
  await Linter.cmd({ cmd, dag, docpath: yamlPath, cwd, interactive: true });
}
