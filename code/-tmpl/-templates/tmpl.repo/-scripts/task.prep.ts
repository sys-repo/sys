import { Workspace } from '@sys/workspace';
import { PATHS } from './common.ts';

/**
 * Write all {pkg}.ts files with name/version values synced
 * to their corresponding current `deno.json` file values.
 */
async function updatePackages(cwd = Deno.cwd()) {
  const source = { include: [`./${PATHS.packages}/**/deno.json`] };
  await Workspace.Pkg.sync({ cwd, source, log: true });
}

/**
 * Sync generated CI workflows for workspace packages.
 */
async function updateCi(cwd = Deno.cwd()) {
  const on = {
    pull_request: { branches: ['main'] },
    push: { branches: ['main'] },
  } as const;

  const source = { root: PATHS.packages };
  await Workspace.Ci.Build.sync({ cwd, log: true, source, target: PATHS.build, on });
  await Workspace.Ci.Test.sync({ cwd, log: true, source, target: PATHS.test, on });
}

export async function main(cwd = Deno.cwd()) {
  await Workspace.Prep.Deps.sync({ cwd, log: true });
  await Workspace.Prep.run({ cwd });
  await updatePackages(cwd);
  await updateCi(cwd);
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
