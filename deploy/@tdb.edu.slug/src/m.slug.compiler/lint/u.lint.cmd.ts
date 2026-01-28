import { type t, c, Cli, Str } from './common.ts';
import { Linter } from './u.lint.ts';

type Args = {
  cmd: t.Crdt.Cmd.Client;
  dag: t.Graph.Dag.Result;
  docpath: t.ObjectPath;
  cwd?: t.StringDir;
  interactive?: boolean;
  facets?: t.DocLintFacet[];
  print?: boolean;
};

/**
 * CLI-friendly lint execution helper.
 */
export async function runLintCommand(args: Args): Promise<t.DocLintResult> {
  const { cmd, dag, docpath, cwd, interactive, print = true } = args;
  const facets = args.facets ? [...args.facets] : undefined;
  const createCrdt = async () => (await cmd.send('doc:create', {})).doc;
  const res = await Linter.run(dag, docpath, { cwd, interactive, facets, createCrdt });

  if (print) {
    const table = Cli.table();
    const kv = (k: string, v: string = '') => table.push([c.gray(k), v]);
    const success = res.ok ? c.green : c.red;
    kv(success(`${res.ok ? '✔' : '✘'} Lint`));
    kv('  Issues:', success(String(res.issues.length)));
    kv('  Facets:', c.gray(res.facets.join(' | ')));
    kv('  Yaml Path:', c.gray(`/${docpath.join('/')}`));
    console.info(Str.trimEdgeNewlines(String(table)));
    console.info();
  }

  return res;
}
