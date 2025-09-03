import { json } from './-bundle.ts';

import { type t, c, Cli, Fs, pkg, TmplEngine } from './common.ts';
import { makeProcessor } from './u.processFile.ts';
import { prompt } from './u.prompt.ts';

export type Options = { dryRun?: boolean; force?: boolean };
export type RunResult = t.TmplWriteResult;

/**
 * Non-interactive runner (programmatic entry).
 */
export async function run(
  targetDir: string,
  bundleRoot: string,
  opts: Options = {},
): Promise<RunResult> {
  const { dryRun = false, force = false } = opts;

  // Ensure signature + filter are correct and boundary-safe:
  const processFile = makeProcessor(bundleRoot);
  const prefix = `${bundleRoot}/`;
  const inScope = (p: string) => p === bundleRoot || p.startsWith(prefix);

  const tmpl = TmplEngine.makeTmpl(json, { processFile }).filter((e) => inScope(e.path));
  return tmpl.write(targetDir, { dryRun, force });
}

/**
 * CLI entry (interactive prompts → run).
 */
export async function cli(opts: Options = {}): Promise<void> {
  // Gather inputs and execute
  const { targetDir, bundle } = await prompt();
  const res = await run(targetDir, bundle.root, opts);

  // Log outcome:
  const { ops } = res;
  let location = Cli.Fmt.path(Fs.trimCwd(targetDir), (e) => {
    if (e.is.basename) e.change(c.white(e.text));
  });
  location = c.gray(`${location}/`);

  console.info();
  console.info(c.cyan(`${pkg.name}`));
  console.info(c.gray(`location: ${location}`));
  console.info(c.gray(`template: ${c.bold(c.green(`${bundle.name}`))}`));
  console.info();

  const table = TmplEngine.Log.table(ops, targetDir);
  console.info(table);
  console.info();
}
