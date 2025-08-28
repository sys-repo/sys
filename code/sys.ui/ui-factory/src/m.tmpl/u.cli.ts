import { type t, c, Cli, Fs, pkg, Str } from './common.ts';

/**
 * Run in CLI mode.
 */
export const cli: t.CatalogTmplLib['cli'] = async (args = {}) => {
  const { dryRun = false } = args;
  const { Tmpl } = await import('./m.Tmpl.ts');

  // Resolve current working directory for a terminal context.
  const cwd = Fs.cwd('terminal');

  // Print context:
  const tableMeta = Cli.table([]);
  tableMeta.push([c.green(pkg.name), c.gray(`${pkg.version}`)]);
  tableMeta.push([c.gray('location'), c.gray(`./${Fs.trimCwd(cwd)}`)]);
  console.info(Str.SPACE);
  console.info(tableMeta.toString());

  /**
   * 1a) Ask for the target folder name.
   */
  const dirname = await Cli.Prompt.Input.prompt({
    message: 'Catalog Folder Name',
    default: 'catalog',
    // Keep folder-name simple + safe: letters, numbers, dot, dash, underscore, slashes (no spaces).
    validate: (v: string) =>
      /^[\w.\-\/]+$/.test(v) || 'Use letters, numbers, ".", "-", "_" (and optional "/")',
  });

  /**
   * 1b) Select which template to install (maps bundle-root → target root name).
   */
  const TEMPLATE_CHOICES = [
    { name: 'catalog:react', bundleRoot: 'catalog-react' },
    // 🌳 Future variants go here, e.g.:
    // { name: 'catalog-lite', bundleRoot: 'catalog-react-lite' },
  ] as const;
  type TemplateChoice = (typeof TEMPLATE_CHOICES)[number];

  const chosenTemplate = await Cli.Prompt.Select.prompt<TemplateChoice>({
    message: 'Template',
    options: TEMPLATE_CHOICES.map((x) => ({ name: `make → ${x.name}`, value: x })),
  });

  /**
   * 2) Compose target path and write the scaffold.
   */
  const target = `${cwd}/${dirname}`;
  const res = await Tmpl.write(target, {
    dryRun,
    bundleRoot: chosenTemplate.bundleRoot,
  });

  /**
   * 3) Prepare a concise table of operations.
   */
  const table = Tmpl.table(res.ops, { baseDir: target, dryRun });

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
  console.info(c.gray(`scaffold: ${c.bold(c.green(`${chosenTemplate.name}`))}`));
  console.info();
  console.info(table);
  console.info();
};
