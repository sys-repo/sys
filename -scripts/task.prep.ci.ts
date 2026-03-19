import { MonorepoCi as Ci } from '../code/sys/monorepo/src/m.ci/mod.ts';
import type { MonorepoCi } from '../code/sys/monorepo/src/m.ci/t.ts';
import { Paths } from './-PATHS.ts';
import { c, Str } from './common.ts';

type Options = {
  versionFilter?: MonorepoCi.Jsr.VersionFilter;
  prepared?: number;
  final?: boolean;
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

  const commit = versionFilter === 'ahead'
    ? c.italic(`${c.green('chore(ci): refresh ahead-only GitHub workflow outputs')}`)
    : c.italic(c.green('chore(ci): refresh generated GitHub workflow outputs'));
  console.info();
  console.info(c.gray('  commit msg:'), commit);
  console.info();

  if (options.final && typeof options.prepared === 'number') {
    const workspaceCommit = c.italic(
      c.green(`chore(workspace): prepared ${options.prepared} workspace ${Str.plural(options.prepared, 'package')}`),
    );
    console.info();
    console.info(c.gray('━'.repeat(84)));
    console.info(c.gray('final commit msg:'), workspaceCommit);
    console.info();
  }
}
