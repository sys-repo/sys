/**
 * @module
 * File-system templates for `@sys/ui-factory`.
 */
import { Args, c, Cli } from '@sys/cli';
import { Str } from '@sys/std';
import { Fs, TmplEngine } from '@sys/tmpl-engine';
import type { t } from '../common.ts';
import { pkg } from '../pkg.ts';
import { json, makeBundle, makeProcessor } from './-bundle.ts';

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

  const processFile = makeProcessor(bundleRoot);
  const prefix = `${bundleRoot}/`;
  const inScope = (p: string) => p === bundleRoot || p.startsWith(prefix);

  const tmpl = TmplEngine.makeTmpl(json, { processFile }).filter((e: t.FileMapFilterArgs) =>
    inScope(e.path),
  );
  return tmpl.write(targetDir, { dryRun, force });
}

/**
 * CLI entry (interactive prompts → run).
 */
export async function cli(opts: Options = {}): Promise<void> {
  const { targetDir, bundle } = await prompt();
  const res = await run(targetDir, bundle.root, opts);

  const { ops } = res;
  let location = Cli.Fmt.path(
    Fs.trimCwd(targetDir),
    (e: { part: string; is: { basename: boolean }; change: (part: string) => void }) => {
      if (e.is.basename) e.change(c.white(e.part));
    },
  );
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

/**
 * Command-line:
 */
if (import.meta.main) {
  type A = { bundle?: boolean; dryRun?: boolean; force?: boolean };
  const { bundle, dryRun, force } = Args.parse<A>(Deno.args);
  if (bundle) {
    await makeBundle();
  } else {
    await cli({ dryRun, force });
  }
}

async function prompt() {
  const cwd = Fs.cwd('terminal');
  const tree = await Fs.Fmt.treeFromDir(cwd, 1);
  console.info(c.gray(`${c.green('Current:')} ${cwd}`), '\n');
  console.info(c.gray(tree));

  const title = c.gray(`${c.green(pkg.name)}/${c.white('tmpl')} ${pkg.version}`);
  console.info(`${Str.SPACE}\n${title}`);

  const dirname = await Cli.Input.Text.prompt({
    message: 'Write to folder',
    default: 'catalog',
    validate: (v: string) =>
      /^[\w.\-\/]+$/.test(v) || 'Use letters, numbers, ".", "-", "_" (and optional "/")',
  });

  type Choice = { name: string; bundleRoot: t.StringDir };
  const TEMPLATE_CHOICES = [
    { name: 'react/catalog: folder structure', bundleRoot: 'react.catalog.folder' },
    { name: 'react/catalog: single file', bundleRoot: 'react.catalog.singlefile' },
  ] as const satisfies readonly Choice[];

  const chosen = await Cli.Input.Select.prompt<(typeof TEMPLATE_CHOICES)[number]>({
    message: 'Choose Template',
    options: TEMPLATE_CHOICES.map((x) => ({ name: `- ${x.name}`, value: x })),
  });

  return {
    targetDir: `${cwd}/${dirname}`,
    bundle: { root: chosen.bundleRoot, name: chosen.name },
  } as const;
}
