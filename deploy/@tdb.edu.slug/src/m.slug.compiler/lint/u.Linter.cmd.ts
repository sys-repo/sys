import { type t } from './common.ts';
import { run } from './u.Linter.run.ts';
import { printLintSummary } from './u.lint.print.ts';

type Args = {
  cmd: t.Crdt.Cmd.Client;
  dag: t.Graph.Dag.Result;
  docpath: t.ObjectPath;
  cwd: t.StringDir;
  interactive?: boolean;
  facets?: t.DocLintFacet[];
  print?: boolean;
};

/**
 * CLI-friendly lint execution helper.
 */
export async function cmd(args: Args): Promise<t.DocLintResult> {
  const { cmd, dag, docpath, cwd, interactive, print = true } = args;
  const facets = args.facets ? [...args.facets] : undefined;
  const createCrdt = async () => (await cmd.send('doc:create', {})).doc;

  const res = await run(dag, docpath, { cwd, interactive, facets, createCrdt, print });

  if (print) printLintSummary({ res, docpath });
  return res;
}
