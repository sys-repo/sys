import { Workspace, type t as wt } from '@sys/workspace';
import { Paths } from './-PATHS.ts';
import { Cli, Str, type t } from './common.ts';

type Options = {
  versionFilter?: wt.WorkspaceCi.Jsr.VersionFilter;
  sourcePaths?: readonly t.StringPath[];
  prepared?: number;
  final?: boolean;
};

type Lib = {
  readonly ensureGraph: (cwd: t.StringDir) => Promise<unknown>;
  readonly syncJsr: typeof Workspace.Ci.Jsr.sync;
  readonly syncBuild: typeof Workspace.Ci.Build.sync;
  readonly syncTest: typeof Workspace.Ci.Test.sync;
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
  'deploy/@tdb.slc.data',
] as const;

export function toJsrCiPaths(paths: readonly string[]) {
  return paths.filter((path) => JsrIncludePrefixes.some((item) => path.startsWith(item)));
}

const lib: Lib = {
  ensureGraph: (cwd) => Workspace.Prep.Graph.ensure({ cwd }),
  syncJsr: Workspace.Ci.Jsr.sync,
  syncBuild: Workspace.Ci.Build.sync,
  syncTest: Workspace.Ci.Test.sync,
} as const;

export async function main(options: Options = {}, api: Lib = lib) {
  const cwd = Deno.cwd();
  const jsrTarget = '.github/workflows/jsr.yaml';
  const buildTarget = '.github/workflows/build.yaml';
  const testTarget = '.github/workflows/test.yaml';
  /**
   * 🐷 TODO:
   * Move the remaining workspace-CI-specific policy/reporting from root scripts
   * into @sys/workspace/ci after the rename/refinement pass settles.
   */
  const jsrSourcePaths = options.sourcePaths ?? Paths.modules;
  const jsrPaths = toJsrCiPaths(jsrSourcePaths);
  const versionFilter = options.versionFilter ?? 'all';
  await api.ensureGraph(cwd);
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

  const jsr = await api.syncJsr({
    cwd,
    env,
    log: true,
    on: { push: { tags: ['jsr-publish', 'jsr-publish-main'] }, workflow_dispatch: true },
    source: { paths: jsrPaths },
    target: jsrTarget,
    versionFilter,
  });
  await api.syncBuild({
    cwd,
    env,
    log: true,
    on,
    source: { paths: Paths.modules },
    target: buildTarget,
  });
  await api.syncTest({
    cwd,
    env,
    log: true,
    on,
    source: { paths: Paths.modules },
    target: testTarget,
  });

  const commit =
    versionFilter === 'ahead'
      ? 'chore(ci): refresh ahead-only GitHub workflow outputs'
      : 'chore(ci): refresh generated GitHub workflow outputs';
  console.info();
  console.info(Cli.Fmt.Commit.suggestion(commit, { title: false, message: { color: 'green' } }));
  console.info();

  if (options.final && typeof options.prepared === 'number') {
    const msg = `chore(workspace): prepared ${options.prepared} ${Str.plural(options.prepared, 'submodule')} (${jsr.count} jsr:publish ${Str.plural(jsr.count, 'module')})`;
    console.info();
    console.info(Cli.Fmt.hr('gray'));
    console.info(Cli.Fmt.Commit.suggestion(msg, { title: 'final commit msg:' }));
    console.info();
  }
}
