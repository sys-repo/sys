import type { CliSpinner } from '@sys/cli/t';
import { Workspace } from '@sys/workspace';
import { c, Cli, DenoDeps, DenoFile, Fs, Process } from './common.ts';
import { main as prepPaths } from './task.prep.paths.ts';
const TMPL_MODULE_PATH = './code/-tmpl' as const;

type CommitContext = 'prep' | 'bump';

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
  return await Workspace.Pkg.sync({
    cwd: Deno.cwd(),
    source: { include: ['./code/**/deno.json', './deploy/**/deno.json'] },
    log: false,
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
export async function main(context: CommitContext = 'prep') {
  const spinner = Cli.Spinner.create('');
  try {
    await processDeps();

    await runPackageSyncPhase(spinner);

    const prepared = await runProcessPhase(
      spinner,
      'running submodule prep...',
      () => prepSubmodules(),
      (prepared) => {
        const count = `${prepared} ${prepared === 1 ? 'module' : 'modules'}`;
        return `${c.gray('Submodule prep:')} ${c.white(count)}`;
      },
    );

    await runProcessPhase(
      spinner,
      'preparing template bundle...',
      () => prepTmplModule(context),
      () => `${c.gray('Template bundle prep:')} ${c.cyan(TMPL_MODULE_PATH)}`,
    );

    // Finalize package metadata and graph-derived files after all generators have
    // run so `check:graph` validates the final prepared workspace state.
    await runPackageSyncPhase(spinner);

    const prep = await Workspace.Prep.run();
    await prepPaths(undefined, prep.graph.snapshot.graph.orderedPaths);

    return prepared;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(Cli.Fmt.spinnerText(`Prep failed: ${message}`));
    throw err;
  } finally {
    spinner.stop();
  }
}

async function runProcessPhase<T>(
  spinner: CliSpinner.Instance,
  label: string,
  fn: () => Promise<T>,
  done: (res: T) => string,
) {
  spinner.start(Cli.Fmt.spinnerText(label));
  spinner.stop();
  try {
    const res = await fn();
    spinner.succeed(Cli.Fmt.spinnerRaw(done(res), false));
    return res;
  } catch (err) {
    spinner.stop();
    throw err;
  }
}

async function runPackageSyncPhase(spinner: CliSpinner.Instance) {
  spinner.start(Cli.Fmt.spinnerText('syncing package metadata...'));
  try {
    const res = await updatePackages();
    const label = `${c.gray('Package ')}${c.cyan('src/pkg.ts')}${c.gray(' sync:')}`;
    const summaryText = `${res.written} written, ${res.skipped} skipped, ${res.unchanged} unchanged`;
    const summary =
      res.count > 0 && res.unchanged === res.count ? c.dim(summaryText) : c.white(summaryText);
    const text = `${label} ${summary}`;
    spinner.succeed(Cli.Fmt.spinnerRaw(text, false));
  } catch (err) {
    spinner.stop();
    throw err;
  }
}
