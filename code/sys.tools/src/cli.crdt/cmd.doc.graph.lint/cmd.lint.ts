import { buildDocumentDAG } from '../cmd.doc.graph/mod.ts';
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, c, Cli, D, Str } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { Config } from '../u.config.ts';

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

  /**
   * Import the document linter (current built-in implementation).
   * Encapsulates the configured set of doc-lint facets; can be swapped for a
   * plugin implementation in future.
   */
  const { Linter } =
    (await import('../../../-tmp.prog/mod.ts')) as typeof import('../../../-tmp.prog/mod.ts');

  /**
   * Run linter:
   */
  const res = await Linter.run(dag, yamlPath, { interactive: true });

  /** Save facet selection */
  const config = await Config.get(cwd);

  await config.fs.save();

  // res.
  // res.

  /** Print output: */
  const table = Cli.table();
  const kv = (k: string, v: t.Json = '') => table.push([c.gray(k), String(v)]);
  const success = res.ok ? c.green : c.red;
  kv(success(`Lint ${res.ok ? '✔' : '✘'}`));
  kv(' Issues:', success(String(res.issues.length)));
  kv(' Facets:', c.gray(Linter.Facets.join(' | ')));
  kv(' Path (yaml):', c.gray(`/${yamlPath.join('/')}`));
  console.info(Str.trimEdgeNewlines(String(table)));
  console.info();
}
