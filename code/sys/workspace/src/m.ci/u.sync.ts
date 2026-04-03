import { type t, Cli, Fs, Str } from './common.ts';
import { WorkspacePrep } from '../m.prep/mod.ts';
import { runPhase } from '../u.phase.ts';
import { Build } from './m.Build/mod.ts';
import { Jsr } from './m.Jsr/mod.ts';
import { Test } from './m.Test/mod.ts';

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
  const targets = wrangle.targets(args.targets);
  const on = args.on ?? wrangle.on(targets.jsr);
  const jsrOn = args.jsrOn ?? wrangle.jsrOn();
  const env = args.env ?? {};
  const spinner = Cli.Spinner.create('');
  const jsrPaths = await wrangle.jsrPaths(sourcePaths, cwd, args.jsrScopes);

  try {
    await runPhase({
      spinner,
      label: 'ensuring workspace graph...',
      silent,
      fn: () => WorkspacePrep.Graph.ensure({ cwd, silent: true }),
    });

    const jsr = await runPhase({
      spinner,
      label: 'syncing JSR workflow...',
      silent,
      fn: () =>
        Jsr.sync({
          cwd,
          env,
          log: true,
          on: jsrOn,
          source: { paths: jsrPaths },
          target: targets.jsr,
          versionFilter,
        }),
    });

    const build = await runPhase({
      spinner,
      label: 'syncing build workflow...',
      silent,
      fn: () =>
        Build.sync({
          cwd,
          env,
          log: true,
          on,
          source: { paths: sourcePaths },
          target: targets.build,
        }),
    });

    const test = await runPhase({
      spinner,
      label: 'syncing test workflow...',
      silent,
      fn: () =>
        Test.sync({
          cwd,
          env,
          log: true,
          on,
          source: { paths: sourcePaths },
          target: targets.test,
        }),
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
        ((await Jsr.Is.publishable(path, cwd, { scopes })) ? path : undefined)
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
    const commit = args.versionFilter === 'ahead'
      ? 'chore(ci): refresh ahead-only GitHub workflow outputs'
      : 'chore(ci): refresh generated GitHub workflow outputs';
    console.info();
    console.info(Cli.Fmt.Commit.suggestion(commit, { title: false, message: { color: 'green' } }));
    console.info();

    if (!args.final || typeof args.prepared !== 'number') return;

    const msg = `chore(workspace): prepared ${args.prepared} ${
      Str.plural(args.prepared, 'submodule')
    } (${args.jsr.count} jsr:publish ${Str.plural(args.jsr.count, 'module')})`;
    console.info();
    console.info(Cli.Fmt.hr('gray'));
    console.info(
      Cli.Fmt.Commit.suggestion(msg, {
        title: { text: 'final commit msg:', color: 'cyan', bold: false },
        message: { color: 'white' },
      }),
    );
    console.info();
  },
} as const;
