import { WorkspacePrep } from '../m.prep/mod.ts';
import { runPhase } from '../u.phase.ts';
import { type t, Cli, Fs, Str } from './common.ts';
import { Build } from './m.Build/mod.ts';
import { Jsr } from './m.Jsr/mod.ts';
import { Test } from './m.Test/mod.ts';
import { formatSyncResult } from './u.source.ts';

type OTarget = {
  readonly jsr: t.StringPath;
  readonly build: t.StringPath;
  readonly test: t.StringPath;
};

export async function sync(args: t.WorkspaceCi.SyncArgs) {
  const cwd = args.cwd ?? Fs.cwd();
  const silent = args.silent ?? false;
  const sourcePaths = args.sourcePaths;
  const versionFilter = args.versionFilter ?? 'all';
  const ensureGraph = args.ensureGraph ?? true;
  const targets = wrangle.targets(args.targets);
  const on = args.on ?? wrangle.on(targets.jsr);
  const jsrOn = args.jsrOn ?? wrangle.jsrOn();
  const env = args.env ?? {};
  const spinner = Cli.Spinner.create('');
  const jsrPaths = await wrangle.jsrPaths(sourcePaths, cwd, args.jsrScopes);

  try {
    if (ensureGraph) {
      await runPhase({
        spinner,
        label: 'ensuring workspace graph...',
        silent,
        fn: () => WorkspacePrep.Graph.ensure({ cwd, silent: true }),
      });
    }

    const jsr = await runPhase({
      spinner,
      label: 'syncing JSR workflow...',
      silent,
      fn: () =>
        Jsr.sync({
          cwd,
          env,
          log: false,
          on: jsrOn,
          source: { paths: jsrPaths },
          target: targets.jsr,
          versionFilter,
        }),
      done: (result) => formatSyncResult('jsr', result),
    });

    const build = await runPhase({
      spinner,
      label: 'syncing build workflow...',
      silent,
      fn: () =>
        Build.sync({
          cwd,
          env,
          log: false,
          on,
          source: { paths: sourcePaths },
          target: targets.build,
        }),
      done: (result) => formatSyncResult('build', result),
    });

    const test = await runPhase({
      spinner,
      label: 'syncing test workflow...',
      silent,
      fn: () =>
        Test.sync({
          cwd,
          env,
          log: false,
          on,
          source: { paths: sourcePaths },
          target: targets.test,
        }),
      done: (result) => formatSyncResult('test', result),
    });

    if (!silent) wrangle.log({ versionFilter, final: args.final, prepared: args.prepared, jsr });
    return { jsr, build, test };
  } finally {
    spinner.stop();
  }
}

const wrangle = {
  async jsrPaths(paths: readonly t.StringPath[], cwd: t.StringDir, scopes?: readonly string[]) {
    const results = await Promise.all(
      paths.map(async (path) =>
        (await Jsr.Is.publishable(path, cwd, { scopes })) ? path : undefined,
      ),
    );
    return results.filter((item): item is t.StringPath => !!item);
  },

  targets(targets: t.WorkspaceCi.SyncArgs['targets']): OTarget {
    return {
      jsr: targets?.jsr ?? '.github/workflows/jsr.yaml',
      build: targets?.build ?? '.github/workflows/build.yaml',
      test: targets?.test ?? '.github/workflows/test.yaml',
    };
  },

  on(jsrTarget: t.StringPath): t.WorkspaceCi.WorkflowOn {
    return {
      push: {
        branches: ['main'],
        paths_ignore: [jsrTarget],
      },
    };
  },

  jsrOn(): t.WorkspaceCi.WorkflowOn {
    return {
      push: {
        tags: ['jsr-publish', 'jsr-publish-main'],
      },
      workflow_dispatch: true,
    };
  },

  log(args: {
    readonly versionFilter: t.WorkspaceCi.Jsr.VersionFilter;
    readonly final?: boolean;
    readonly prepared?: number;
    readonly jsr: t.WorkspaceCi.SyncResult;
  }) {
    const commit =
      args.versionFilter === 'ahead'
        ? 'chore(ci): refresh ahead-only GitHub workflow outputs'
        : 'chore(ci): refresh generated GitHub workflow outputs';
    const suggestion = Cli.Fmt.Commit.suggestion(commit, {
      title: false,
      message: { color: 'gray' },
    });
    console.info();
    console.info(`  ${suggestion}`);

    if (!args.final || typeof args.prepared !== 'number') {
      console.info();
      return;
    }

    const packages = `${args.prepared} workspace ${Str.plural(args.prepared, 'package')}`;
    const modules = `${args.jsr.count} jsr:publish ${Str.plural(args.jsr.count, 'module')}`;
    const msg = `chore(workspace): refreshed ${packages} (${modules})`;
    console.info();
    console.info(Cli.Fmt.hr('cyan'));
    console.info(
      Cli.Fmt.Commit.suggestion(msg, {
        title: { text: 'final commit msg:', color: 'cyan', bold: false },
        message: { color: 'white' },
      }),
    );
    console.info();
  },
} as const;
