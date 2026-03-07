import { MonorepoCi as Ci } from '@sys/monorepo/ci';

const PATHS = {
  projects: 'code/projects',
  build: '.github/workflows/build.yaml',
  test: '.github/workflows/test.yaml',
} as const;

export async function main(cwd = Deno.cwd()) {
  const on = {
    pull_request: { branches: ['main'] },
    push: { branches: ['main'] },
  } as const;
  await Ci.Build.sync({ cwd, log: true, source: { root: PATHS.projects }, target: PATHS.build, on });
  await Ci.Test.sync({ cwd, log: true, source: { root: PATHS.projects }, target: PATHS.test, on });
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
