import { json } from './-bundle.ts';

import { type t, c, Cli, Fs, Is, pkg, TemplateNames, Templates, TmplEngine } from './common.ts';
import { Prompt } from './u.prompt.ts';

export type Options = {
  dryRun?: boolean;
  force?: boolean;
  tmpl?: string;
};

/**
 * CLI entry (interactive prompts → run).
 */
export async function cli(opts: Options = {}): Promise<void> {
  const { dryRun = false, force = false } = opts;

  /**
   * Context:
   */
  const cwd = Fs.cwd('terminal');
  const tree = await Fs.Fmt.treeFromDir(cwd, 1);
  console.info(c.gray(`${c.green('Current:')} ${cwd}`), '\n');
  console.info(c.gray(tree));

  /**
   * Derive template name
   */
  const root = opts.tmpl || (await Prompt.selectTemplate());
  if (!TemplateNames.includes(root)) {
    const failed = c.bold(c.yellow('Failed:'));
    const msg = `${failed} A template named "${c.white(root)}" does not exist.`;
    console.info();
    console.warn(c.gray(msg));
    console.info(c.gray(c.italic('(pass nothing for interactive selection)')));
    console.info();
    return;
  }

  /**
   * Defer to external library templates:
   */
  if (root === '@sys/ui-factory/tmpl') {
    const { cli } = await import('@sys/ui-factory/tmpl');
    return void (await cli({ dryRun, force }));
  }

  /**
   * Run local templates:
   */
  const targetDir = await Prompt.directoryName();
  if (await Fs.exists(targetDir)) {
    const noChange = c.green('No Change');
    const msg = `${c.yellow('Warning:')} Something already exists at that location (${noChange}).`;
    console.info();
    console.warn(c.gray(msg));
    console.warn(c.gray(targetDir));
    console.info();
    return;
  }

  const source = await Templates[root as keyof typeof Templates]();
  if (!Is.func(source.default)) {
    const whiteName = c.white(root);
    const err = `The template named "${whiteName}" does not export a default function from the '.tmpl.ts' file.`;
    const msg = `${c.yellow('Failed:')} ${err}`;
    console.info();
    console.warn(c.gray(msg));
    console.info();
    return;
  }

  /**
   * Write:
   */
  const fileProcessor: t.FileMapProcessor = async (e) => {
    // If under root, strip that prefix so files land at the target root.
    if (e.path.startsWith(`${root}/`)) {
      const next = e.path.slice(root.length + 1);
      if (!next) return e.skip('error: empty path after strip');
      e.target.rename(next, true);
    }
  };

  /**
   * Setup and filter template:
   */
  type F = t.FileMapFilterArgs;
  const inScope = (e: F) => e.path.startsWith(`${root}/`);
  const notHidden = (e: F) => e.filename !== '.tmpl.ts'; // NB: the initialization script for the template: IS NOT content.
  const tmpl = TmplEngine
    //
    .makeTmpl(json, fileProcessor)
    .filter(inScope)
    .filter(notHidden);

  // Write to disk.
  const res = await tmpl.write(targetDir, { dryRun, force });
  await source.default(res.dir.target);

  /**
   * Print:
   */
  const { ops } = res;
  let location = Cli.Format.path(Fs.trimCwd(targetDir), (e) => {
    if (e.is.basename) e.change(c.white(e.text));
  });
  location = c.gray(`${location}/`);

  console.info();
  console.info(c.cyan(`${pkg.name}`));
  console.info(c.gray(`location: ${location}`));
  console.info(c.gray(`template: ${c.bold(c.green(`${root}`))}`));
  console.info();

  const table = TmplEngine.Log.table(ops, targetDir);
  console.info(table);
  console.info();
}
