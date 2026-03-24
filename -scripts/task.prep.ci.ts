import { Workspace, type t as wt } from '@sys/workspace';
import { Paths } from './-PATHS.ts';
import { c, Str, type t } from './common.ts';

type Options = {
  versionFilter?: wt.WorkspaceCi.Jsr.VersionFilter;
  sourcePaths?: readonly t.StringPath[];
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
  /**
   * 🐷 TODO:
   * Move the remaining workspace-CI-specific policy/reporting from root scripts
   * into @sys/workspace/ci after the rename/refinement pass settles.
   */
  const jsrSourcePaths = options.sourcePaths ?? Paths.modules;
  const jsrPaths = toJsrCiPaths(jsrSourcePaths);
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

  const jsr = await Workspace.Ci.Jsr.sync({
    cwd,
    env,
    log: true,
    on: { push: { tags: ['jsr-publish', 'jsr-publish-main'] }, workflow_dispatch: true },
    source: { paths: jsrPaths },
    target: jsrTarget,
    versionFilter,
  });
  await Workspace.Ci.Build.sync({
    cwd,
    env,
    log: true,
    on,
    source: { paths: Paths.modules },
    target: buildTarget,
  });
  await Workspace.Ci.Test.sync({
    cwd,
    env,
    log: true,
    on,
    source: { paths: Paths.modules },
    target: testTarget,
  });

  const commit =
    versionFilter === 'ahead'
      ? c.italic(`${c.green('chore(ci): refresh ahead-only GitHub workflow outputs')}`)
      : c.italic(c.green('chore(ci): refresh generated GitHub workflow outputs'));
  console.info();
  console.info(c.gray('  commit msg:'), commit);
  console.info();

  if (options.final && typeof options.prepared === 'number') {
    const msg = `chore(workspace): prepared ${options.prepared} ${Str.plural(options.prepared, 'submodule')} (${jsr.count} jsr:publish ${Str.plural(jsr.count, 'module')})`;
    const workspaceCommit = c.white(msg);
    console.info();
    console.info(c.gray('━'.repeat(84)));
    console.info(c.bold(c.brightCyan('Final commit msg:')), workspaceCommit);
    console.info();
  }
}
