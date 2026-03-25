import type { CliSpinner } from '@sys/cli/t';
import { Workspace } from '@sys/workspace';
import { c, Cli, DenoDeps, DenoFile, Fs, Process } from './common.ts';
import { main as prepPaths } from './task.prep.paths.ts';
const i = c.italic;
const TMPL_MODULE_PATH = './code/-tmpl' as const;

type CommitContext = 'prep' | 'bump';
type Options = {
  readonly orderedPaths?: readonly string[];
};

/**
 * Process the dependencies into `deno.json` and `package.json` files.
 */
async function processDeps() {
  const res = await DenoDeps.from('./deps.yaml');
  if (res.error) {
    console.error(res.error);
    return;
  }

  const PATH = {
    package: './package.json',
    deno: './imports.json',
  } as const;

  /**
   * Write to file-system: [deno.json | package.json].
   */
  const deps = res.data?.deps ?? [];
  await Fs.writeJson(PATH.package, DenoDeps.toJson('package.json', deps));
  await Fs.writeJson(PATH.deno, DenoDeps.toJson('deno.json', deps));

  /**
   * Output: console.
   */
  const total = deps.length.toLocaleString();
  const fp = (text: string) => c.cyan(text); // fp: file-path
  const fmtSeeFiles = `${fp(PATH.deno)} ${c.gray('|')} ${fp(PATH.package)}`;
  console.info();
  console.info(c.brightGreen(c.bold('Workspace Import Map')));
  console.info(c.gray(` (${total} dependencies written to):`), fmtSeeFiles);
  console.info();
  console.info(DenoDeps.Fmt.deps(deps, { indent: 1 }));
  console.info();
}

/**
 * Write all {pkg}.ts files with name/version values synced
 * to their corresponding current `deno.json` file values.
 */
async function updatePackages() {
  await Workspace.Pkg.sync({
    cwd: Deno.cwd(),
    source: { include: ['./code/**/deno.json', './deploy/**/deno.json'] },
    log: true,
  });
}

/**
 * Run `prep` → `init` commands on sub-modules.
 */
async function prepSubmodules() {
  const ws = await DenoFile.workspace();
  let prepared = 0;
  // Run sequentially so workspace prep stays in the same deterministic package order
  // used elsewhere in the repo and submodule output remains easy to follow.
  for (const item of ws.children) {
    if (item.path.dir === Fs.resolve(TMPL_MODULE_PATH)) continue;
    const tasks = item.denofile.tasks;
    if (tasks) {
      if (tasks.prep) {
        await runTaskOrThrow(item.path.dir, 'deno task prep');
        prepared += 1;
      }
      if (tasks.init) await runTaskOrThrow(item.path.dir, 'deno task init');
    }
  }

  return prepared;
}

/**
 * The template bundle is a critical generated artifact consumed across the repo.
 * Root prep owns this explicitly rather than relying on generic workspace traversal.
 */
async function prepTmplModule(context: CommitContext) {
  const commitContext = context === 'bump' ? 'bump' : 'tmpl';
  await runTaskOrThrow(
    TMPL_MODULE_PATH,
    `deno run -P=prep ./-scripts/task.prep.ts --commit-context=${commitContext}`,
  );
}

async function runTaskOrThrow(path: string, command: string) {
  const parts = command.trim().split(/\s+/);
  const [cmd, ...args] = parts;
  const res = await Process.inherit({ cmd, args, cwd: path });
  if (res.success) return;
  throw new Error(`Failed in ${path}: ${command}`);
}

/**
 * Prepare the [deno.json | package.json] files from
 * definitions within the workspace `deps.yaml` configuration.
 */
export async function main(context: CommitContext = 'prep', options: Options = {}) {
  const spinner = Cli.Spinner.create('');
  try {
    await processDeps();
    const prep = await Workspace.Prep.run();
    await runSilentPhase(
      spinner,
      `deriving ${c.bold(c.white('@sys'))} topological workspace module order...`,
      () => prepPaths(undefined, options.orderedPaths ?? prep.graph.snapshot.graph.orderedPaths),
    );

    console.info(Cli.Fmt.spinnerText('syncing package metadata...'));
    await updatePackages();

    console.info(Cli.Fmt.spinnerText('running submodule prep...'));
    const prepared = await prepSubmodules();

    console.info(Cli.Fmt.spinnerText('preparing template bundle...'));
    await prepTmplModule(context);
    return prepared;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(Cli.Fmt.spinnerText(`Prep failed: ${message}`));
    throw err;
  } finally {
    spinner.stop();
  }
}

async function runSilentPhase<T>(
  spinner: CliSpinner.Instance,
  label: string,
  fn: () => Promise<T>,
) {
  spinner.start(Cli.Fmt.spinnerText(label));
  try {
    return await fn();
  } finally {
    spinner.stop();
  }
}
