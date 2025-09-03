import { json } from './-bundle.ts';

import { c, Cli, Fs, pkg, TmplEngine } from './common.ts';
import { makeProcessor } from './u.processFile.ts';
import { promptUser } from './u.prompt.ts';

export type CliArgs = { dryRun?: boolean; force?: boolean; bundle?: boolean };

/**
 * Run template in command-line mode.
 */
export async function cli(args: CliArgs = {}): Promise<void> {
  const { dryRun = false, force = false } = args;

  /**
   * Build template:
   * Canonical: from → filter (scope) → write
   */
  const { targetDir, bundle } = await promptUser();
  const processFile = makeProcessor(bundle);

  // Canonical: from → filter (scope) → write
  const tmpl = TmplEngine
    //
    .makeTmpl(json, { processFile })
    .filter((e) => e.path.startsWith(bundle.root));

  const written = await tmpl.write(targetDir, { dryRun, force });
  const { ops } = written;

  /**
   * 4) Print summary.
   */
  let location = Cli.Format.path(Fs.trimCwd(targetDir), (e) => {
    if (e.is.basename) e.change(c.white(e.text));
  });
  location = c.gray(`${location}/`);

  console.info();
  console.info(c.cyan(`${pkg.name}`));
  console.info(c.gray(`location: ${location}`));
  console.info(c.gray(`template: ${c.bold(c.green(`${bundle.name}`))}`));
  console.info();

  const table = TmplEngine.Log.table(ops, targetDir);
  if (table) {
    console.info(table);
    console.info();
  }
}
