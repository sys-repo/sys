import { type t, c, Cli, Fs, pkg, Str } from './common.ts';

export async function promptUser() {
  /**
   * Context:
   */
  const cwd = Fs.cwd('terminal');
  const tree = await Fs.Fmt.treeFromDir(cwd, 1);
  console.info(c.gray(cwd), '\n');
  console.info(c.gray(tree));

  const title = c.gray(`${c.green(pkg.name)}/${c.white('tmpl')} ${pkg.version}`);
  console.info(`${Str.SPACE}\n${title}`);

  /**
   * 1) Prompt: target folder:
   */
  const dirname = await Cli.Prompt.Input.prompt({
    message: 'Write to folder',
    default: 'catalog',
    validate: (v: string) =>
      /^[\w.\-\/]+$/.test(v) || 'Use letters, numbers, ".", "-", "_" (and optional "/")',
  });

  /**
   * 2) Prompt: choose template bundle:
   */
  type Choice = { name: string; bundleRoot: t.StringDir };
  const TEMPLATE_CHOICES = [
    { name: 'react/catalog: folder structure', bundleRoot: 'react.catalog.folder' },
    { name: 'react/catalog: single file', bundleRoot: 'react.catalog.singlefile' },
  ] as const satisfies readonly Choice[];

  const chosen = await Cli.Prompt.Select.prompt<(typeof TEMPLATE_CHOICES)[number]>({
    message: 'Choose Template',
    options: TEMPLATE_CHOICES.map((x) => ({ name: `- ${x.name}`, value: x })),
  });

  /**
   * 3) Compose + write template:
   */
  const targetDir = `${cwd}/${dirname}`;
  const root = chosen.bundleRoot;
  const name = chosen.name;

  // API:
  return {
    targetDir,
    bundle: { root, name },
  } as const;
}
