import { type t, c, Cli, Fs, pkg } from './common.ts';

/**
 * Run in CLI mode.
 */
export const cli: t.CatalogTmplLib['cli'] = async (_args = {}) => {
  const { Tmpl } = await import('./m.Tmpl.ts');

  // Resolve current working directory for a terminal context.
  const cwd = Fs.cwd('terminal'); // string dir

  // 1) Ask for the target folder name.
  const dirname = await Cli.Prompt.Input.prompt({
    message: 'Catalog folder name',
    default: 'catalog',
    // keep it simple + safe: letters, numbers, dot, dash, underscore, slashes (no spaces)
    validate: (v: string) =>
      /^[\w.\-\/]+$/.test(v) || 'Use letters, numbers, ".", "-", "_" (and optional "/")',
  });

  // 2) Compose target path and write the scaffold.
  const target = `${cwd}/${dirname}` as t.StringDir;

  // Preview-first? Flip to { dryRun: true } if you prefer an interactive confirm step.
  const res = await Tmpl.write(target, { dryRun: false });

  // 3) Print a concise, cwd-trimmed table of operations.
  const table = Tmpl.table(res.ops, { trimPathLeft: cwd as t.StringDir });

  /**
   * Print:
   */
  const fmtTarget = Cli.Format.path(Fs.trimCwd(target), (e) => {
    if (e.is.basename) e.change(c.white(e.text));
  });

  console.info();
  console.info(c.gray(`${pkg.name}`));
  console.info(c.gray(`${fmtTarget}`));
  console.info(c.bold(c.cyan(`Catalog Scaffold`)));
  console.info();
  console.info(table);
  console.info();
};
