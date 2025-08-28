import { type t, c, Cli, Fs, pkg, Str } from './common.ts';

/**
 * Run in CLI mode.
 */
export const cli: t.CatalogTmplLib['cli'] = async (args = {}) => {
  const { dryRun = false } = args;
  const { Tmpl } = await import('./m.Tmpl.ts');

  // Resolve current working directory for a terminal context.
  const cwd = Fs.cwd('terminal');
  console.info(Str.SPACE);
  console.info(c.gray(`location: ./${Fs.trimCwd(cwd)}`));

  // 1) Ask for the target folder name.
  const dirname = await Cli.Prompt.Input.prompt({
    message: 'Catalog Folder Name',
    default: 'catalog',
    // Keep it simple + safe: letters, numbers, dot, dash, underscore, slashes (no spaces).
    validate: (v: string) =>
      /^[\w.\-\/]+$/.test(v) || 'Use letters, numbers, ".", "-", "_" (and optional "/")',
  });

  // 2) Compose target path and write the scaffold.
  const target = `${cwd}/${dirname}`;
  const res = await Tmpl.write(target, { dryRun });

  // 3) Print a concise, cwd-trimmed table of operations.
  const table = Tmpl.table(res.ops, { trimPathLeft: cwd });

  /**
   * Print:
   */
  let fmtTarget = Cli.Format.path(Fs.trimCwd(target), (e) => {
    if (e.is.basename) e.change(c.white(e.text));
  });
  fmtTarget = c.gray(`${fmtTarget}/`);

  console.info();
  console.info(c.gray(`${pkg.name}`));
  console.info(c.gray(`location: ${fmtTarget}`));
  console.info(c.bold(c.cyan(`Catalog Scaffold`)));
  console.info();
  console.info(table);
  console.info();
};
