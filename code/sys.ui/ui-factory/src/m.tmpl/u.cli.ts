import { json } from './-bundle.ts';

import { type t, c, Cli, Fs, pkg, TmplEngine } from './common.ts';
import { promptUser } from './u.cli.prompt.ts';
import { makeProcessor } from './u.processFile.ts';

export const cli: t.CatalogTmplCli = async (options = {}) => {
  const { dryRun = false, ctx } = options;

  /**
   * Build template:
   * Canonical: from → filter (scope) → write
   */
  const { targetDir, bundleRoot, bundleName } = await promptUser();
  const processFile = makeProcessor({ bundleRoot });

  // Canonical: from → filter (scope) → write
  const tmpl = TmplEngine
    //
    .makeTmpl(json, { ctx, processFile })
    .filter((e) => e.path.startsWith(bundleRoot));
  const res = await tmpl.write(targetDir as t.StringDir, { dryRun });

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
  console.info(c.gray(`template: ${c.bold(c.green(`${bundleName}`))}`));
  console.info(c.gray(`dry-run:  ${dryRun ? c.yellow('yes') : c.gray('no')}`));
  console.info();

  const table = TmplEngine.Log.table(res.ops, { baseDir: targetDir });
  if (table) {
    console.info(table);
    console.info();
  }
};
