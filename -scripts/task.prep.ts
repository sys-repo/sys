import { Monorepo } from '@sys/workspace';
import { c, DenoDeps, DenoFile, Fs, Process } from './common.ts';
const i = c.italic;
const TMPL_MODULE_PATH = './code/-tmpl' as const;

type CommitContext = 'prep' | 'bump';

/**
 * Proecss the dependencies into a`deno.json` and `package.json` files.
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
  const deps = res.data?.deps;
  await Fs.writeJson(PATH.package, DenoDeps.toJson('package.json', deps));
  await Fs.writeJson(PATH.deno, DenoDeps.toJson('deno.json', deps));

  /**
   * Output: console.
   */
  const fp = (text: string) => i(c.yellow(text)); // fp: file-path
  const fmtSeeFiles = c.gray(`${fp(PATH.deno)} and ${fp(PATH.package)}`);
  console.info();
  console.info(c.brightWhite(`${c.bold('Monorepo Import Map')}`));
  console.info(c.gray(` (dependencies written to):`), fmtSeeFiles);
  console.info();
  console.info(DenoDeps.Fmt.deps(deps, { indent: 1 }));
  console.info();
}

/**
 * Write all {pkg}.ts files with name/version values synced
 * to their corresponding current `deno.json` file values.
 */
async function updatePackages() {
  await Monorepo.Pkg.sync({
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
 * definitions within the monorepo's `deps.yaml` configuration.
 */
export async function main(context: CommitContext = 'prep') {
  await processDeps();
  await updatePackages();
  const prepared = await prepSubmodules();
  await prepTmplModule(context);
  return prepared;
}
