import { type t, c, Cli, Str, Time } from './common.ts';

type Args = {
  res: t.SlugLintResult;
  docpath: t.ObjectPath;
};

export function printSummary(args: Args) {
  const { res, docpath } = args;
  const table = Cli.table();
  const kv = (k: string, v: string = '') => table.push([c.gray(k), v]);
  const success = res.ok ? c.green : c.red;
  kv(success(`${res.ok ? '✔' : '✘'} Lint`), Time.now.format('hh:mm:ss a'));

  kv('  issues:', success(String(res.issues.length)));
  kv('  facets:', c.gray(res.facets.join(' | ')));
  kv('  docpath:', c.gray(`/${Str.trimSlashes(docpath.join('/'))}`));

  console.info();
  console.info(Str.trimEdgeNewlines(String(table)));
  console.info();
}
