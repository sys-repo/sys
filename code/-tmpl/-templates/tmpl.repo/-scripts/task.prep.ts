import { Workspace } from '@sys/workspace';
import { Fs, PATHS } from './common.ts';
import { DenoDeps } from '@sys/driver-deno/runtime';

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
  await syncDeps(cwd);
  await Workspace.Prep.run({ cwd });
  await updatePackages(cwd);
  await updateCi(cwd);
}

async function syncDeps(cwd = Deno.cwd()) {
  if (Workspace.Prep.Deps?.sync) {
    await Workspace.Prep.Deps.sync({ cwd, log: true });
    return;
  }

  const res = await DenoDeps.from(Fs.join(cwd, 'deps.yaml'));
  if (res.error) throw res.error;

  const deps = res.data?.deps ?? [];
  const importsPath = Fs.join(cwd, 'imports.json');
  const packagePath = Fs.join(cwd, 'package.json');
  await Fs.writeJson(importsPath, DenoDeps.toJson('deno.json', deps));
  await Fs.writeJson(packagePath, DenoDeps.toJson('package.json', deps));

  const fmt = Workspace.Prep.Fmt?.importMap;
  if (fmt) {
    console.info(fmt({ cwd, total: deps.length, paths: [importsPath, packagePath] }));
  }
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
