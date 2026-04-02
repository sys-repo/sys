import type { CliSpinner } from '@sys/cli/t';
import { Workspace, type t as wt } from '@sys/workspace';
import { Paths } from './-PATHS.ts';
import { Cli, Fs, Str, Time, type t } from './common.ts';

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

type DenoJson = {
  readonly name?: string;
  readonly version?: string;
};

export async function toJsrCiPaths(paths: readonly string[], cwd = Deno.cwd()) {
  const results = await Promise.all(paths.map(async (path) => ((await isJsrPublishable(path, cwd)) ? path : undefined)));
  return results.filter((item): item is string => !!item);
}

async function isJsrPublishable(path: string, cwd: t.StringDir) {
  const denojson = await loadDenoJson(path, cwd);
  if (!denojson?.name || !denojson.version) return false;
  if (!isJsrPkgName(denojson.name)) return false;
  if (denojson.version === '0.0.0') return false;
  return true;
}

async function loadDenoJson(path: string, cwd: t.StringDir): Promise<DenoJson | undefined> {
  const file = Fs.join(cwd, path, 'deno.json');
  const res = await Fs.readJson<DenoJson>(file);
  return res.data;
}

function isJsrPkgName(name: string) {
  return name.startsWith('@sys/') || name.startsWith('@tdb/');
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
  const jsrPaths = await toJsrCiPaths(jsrSourcePaths, cwd);
  const versionFilter = options.versionFilter ?? 'all';
  const spinner = Cli.Spinner.create('');
  try {
    await runPhase(spinner, 'ensuring workspace graph...', () => api.ensureGraph(cwd));
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

    const jsr = await runPhase(spinner, 'syncing JSR workflow...', () => api.syncJsr({
      cwd,
      env,
      log: true,
      on: { push: { tags: ['jsr-publish', 'jsr-publish-main'] }, workflow_dispatch: true },
      source: { paths: jsrPaths },
      target: jsrTarget,
      versionFilter,
    }));
    await runPhase(spinner, 'syncing build workflow...', () => api.syncBuild({
      cwd,
      env,
      log: true,
      on,
      source: { paths: Paths.modules },
      target: buildTarget,
    }));
    await runPhase(spinner, 'syncing test workflow...', () => api.syncTest({
      cwd,
      env,
      log: true,
      on,
      source: { paths: Paths.modules },
      target: testTarget,
    }));

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
  } finally {
    spinner.stop();
  }
}

async function runPhase<T>(spinner: CliSpinner.Instance, label: string, fn: () => Promise<T>) {
  const startedAt = Time.now.timestamp;
  const text = () => Cli.Fmt.spinnerText(`${label} ${String(Time.elapsed(startedAt))}`);
  const timer = Time.interval(1000, () => (spinner.text = text()));
  spinner.start(text());
  try {
    return await fn();
  } finally {
    timer.cancel();
    spinner.stop();
    console.info();
  }
}
