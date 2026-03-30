import { Workspace } from '@sys/workspace';
import { c, Cli } from '@sys/cli';
import { DenoDeps } from '@sys/driver-deno/runtime';
import { Fs } from '@sys/fs';

const PATHS = {
  projects: 'code/projects',
  build: '.github/workflows/build.yaml',
  test: '.github/workflows/test.yaml',
} as const;

/**
 * Process the dependencies into `imports.json` and `package.json` files.
 */
async function processDeps(cwd = Deno.cwd()) {
  const res = await DenoDeps.from(Fs.join(cwd, 'deps.yaml'));
  if (res.error) {
    console.error(res.error);
    return;
  }

  const PATH = {
    package: Fs.join(cwd, 'package.json'),
    deno: Fs.join(cwd, 'imports.json'),
  } as const;

  const deps = res.data?.deps ?? [];
  await Fs.writeJson(PATH.package, DenoDeps.toJson('package.json', deps));
  await Fs.writeJson(PATH.deno, DenoDeps.toJson('deno.json', deps));

  const total = deps.length.toLocaleString();
  const fp = (text: string) => c.cyan(text);
  const fmtSeeFiles = `${fp(PATH.deno)} ${c.gray('|')} ${fp(PATH.package)}`;
  console.info();
  console.info(c.brightGreen(c.bold('Workspace Import Map')));
  console.info(c.gray(` (${total} dependencies written to):`), fmtSeeFiles);
}

/**
 * Write all {pkg}.ts files with name/version values synced
 * to their corresponding current `deno.json` file values.
 */
async function updatePackages(cwd = Deno.cwd()) {
  const source = { include: ['./code/projects/**/deno.json'] };
  await Workspace.Pkg.sync({ cwd, source, log: true });
}

/**
 * Sync generated CI workflows for project packages.
 */
async function updateCi(cwd = Deno.cwd()) {
  const on = {
    pull_request: { branches: ['main'] },
    push: { branches: ['main'] },
  } as const;

  const source = { root: PATHS.projects };
  await Workspace.Ci.Build.sync({ cwd, log: true, source, target: PATHS.build, on });
  await Workspace.Ci.Test.sync({ cwd, log: true, source, target: PATHS.test, on });
}

export async function main(cwd = Deno.cwd()) {
  await processDeps(cwd);
  await Workspace.Prep.run({ cwd });
  await updatePackages(cwd);
  await updateCi(cwd);
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
