import { type t, c, Cli, Fs, Is, pkg, TemplateNames, Templates, TmplEngine } from './common.ts';
import { makeTmpl } from './u.makeTmpl.ts';
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
  console.info(c.gray(`${c.green('Current:')} ${Cli.Fmt.Path.str(`${cwd}/`)}`), '\n');
  console.info(c.gray(tree));

  /**
   * Derive template name:
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

  const tmplName = root as t.TemplateName;
  const tmplSetup = await Templates[root as t.TemplateName]();

  if (!Is.func(tmplSetup.default)) {
    const whiteName = c.white(root);
    const err = `The template named "${whiteName}" does not export a default function from its '.tmpl.ts' file.`;
    const msg = `${c.yellow('Failed:')} ${err}`;
    console.info();
    console.warn(c.gray(msg));
    console.info();
    return;
  }

  /**
   * Write:
   */
  const tmpl = await makeTmpl(tmplName);
  const res = await tmpl.write(targetDir, { dryRun, force });
  await tmplSetup.default(res.dir.target);

  /**
   * Print:
   */
  const { ops } = res;
  let location = Cli.Fmt.Path.str(`${Fs.trimCwd(targetDir)}/`);
  console.info();
  console.info(c.brightCyan(`${pkg.name}`));
  console.info(c.gray(`location: ${location}`));
  console.info(c.gray(`template: ${c.bold(c.green(`${root}`))}`));
  console.info();

  const table = TmplEngine.Log.table(ops, targetDir);
  console.info(table);
  console.info();
}
