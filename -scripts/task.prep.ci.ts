import { MonorepoCi as Ci } from '@sys/monorepo/ci';
import type { MonorepoCi } from '@sys/monorepo/t';
import { Paths } from './-PATHS.ts';

type Options = {
  versionFilter?: MonorepoCi.Jsr.VersionFilter;
};

export const JsrIncludePrefixes = [
  'code/sys/',
  'code/sys.ui/',
  'code/sys.driver/',
  'code/sys.model/',
  'code/sys.dev',
  'code/sys.tools',
  'code/-tmpl',
  'deploy/@tdb.edu.slug',
  'deploy/@tdb.slc.std',
] as const;

export function toJsrCiPaths(paths: readonly string[]) {
  return paths.filter((path) => JsrIncludePrefixes.some((item) => path.startsWith(item)));
}

export async function main(options: Options = {}) {
  const cwd = Deno.cwd();
  const jsrTarget = '.github/workflows/jsr.yaml';
  const buildTarget = '.github/workflows/build.yaml';
  const testTarget = '.github/workflows/test.yaml';
  const jsrPaths = toJsrCiPaths(Paths.modules);
  const versionFilter = options.versionFilter ?? 'all';
  const on = {
    push: {
      branches: ['main', 'phil-work'],
      paths_ignore: ['.github/workflows/jsr.yaml'],
    },
  } as const;
  const env = {
    // SAMPLE_VAR: '${{ vars.SAMPLE_VAR }}',
    // SAMPLE_SECRET: '${{ secrets.SAMPLE_SECRET }}',
  } as const;

  await Ci.Jsr.sync({
    cwd,
    env,
    log: true,
    on: { push: { tags: ['jsr-publish', 'jsr-publish-main'] }, workflow_dispatch: true },
    source: { paths: jsrPaths },
    target: jsrTarget,
    versionFilter,
  });
  await Ci.Build.sync({
    cwd,
    env,
    log: true,
    on,
    source: { paths: Paths.modules },
    target: buildTarget,
  });
  await Ci.Test.sync({
    cwd,
    env,
    log: true,
    on,
    source: { paths: Paths.modules },
    target: testTarget,
  });
}
