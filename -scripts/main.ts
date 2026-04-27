import { Workspace } from '@sys/workspace';
import { Args, D } from './common.ts';

import { main as clean } from './task.clean.ts';
import { main as dry } from './task.dry.ts';
import { main as info } from './task.info.ts';
import { main as lint } from './task.lint.ts';
import { main as prepCiDeno } from './task.prep.ci.deno.ts';
import { type CommitContext, main as prep, syncPackageMetadata } from './task.prep.ts';
import { main as test } from './task.test.ts';
import { bumpPolicy } from './task.bump.policy.ts';
import { orderedWorkspacePaths } from './u.graph.ts';

export type MainArgs = {
  dry?: boolean;
  test?: boolean;
  info?: boolean;
  clean?: boolean;
  lint?: boolean;
  bump?: boolean;
  prep?: boolean;
  'prep-all'?: boolean;
  'prep-bump'?: boolean;
  'prep-pkg'?: boolean;
  'prep-ci'?: boolean;
  'prep-ci-deno'?: boolean;
  'ahead-only'?: boolean;
  'prep-context'?: CommitContext;
  tmpl?: boolean;
};

type Lib = {
  readonly dry: typeof dry;
  readonly test: typeof test;
  readonly info: typeof info;
  readonly clean: typeof clean;
  readonly lint: typeof lint;
  readonly bump: () => Promise<unknown>;
  readonly prep: (context?: CommitContext) => Promise<number>;
  readonly prepPkg: () => Promise<unknown>;
  readonly prepCi: typeof prepCi;
  readonly prepCiDeno: typeof prepCiDeno;
};

type PrepCiOptions = {
  versionFilter?: 'all' | 'ahead';
  prepared?: number;
  final?: boolean;
  ensureGraph?: boolean;
};

async function prepCi(options: PrepCiOptions = {}) {
  await Workspace.Ci.sync({
    cwd: Deno.cwd(),
    sourcePaths: await orderedWorkspacePaths(),
    jsrScopes: D.ci.jsrScopes,
    on: D.ci.on,
    testBrowserPaths: D.ci.testBrowserPaths,
    versionFilter: options.versionFilter,
    prepared: options.prepared,
    final: options.final,
    ...(options.ensureGraph !== undefined ? { ensureGraph: options.ensureGraph } : {}),
  });
}

const lib: Lib = {
  dry,
  test,
  info,
  clean,
  lint,
  bump: () => Workspace.Bump.run({ cwd: Deno.cwd(), policy: bumpPolicy() }),
  prep,
  prepPkg: syncPackageMetadata,
  prepCi,
  prepCiDeno,
} as const;

export async function run(argv: MainArgs, api: Lib = lib) {
  // CI:
  if (argv.dry) await api.dry();
  if (argv.test) await api.test();
  if (argv.info) await api.info();

  // Maintenance:
  if (argv.clean) await api.clean();
  if (argv.lint) await api.lint();
  if (argv.bump) await api.bump();
  if (argv.prep) await api.prep(argv['prep-context']);
  if (argv['prep-pkg']) await api.prepPkg();
  if (argv['prep-bump']) {
    const prepared = await api.prep(argv['prep-context']);
    await api.prepCi({
      versionFilter: 'ahead',
      prepared,
      final: true,
      ensureGraph: false,
    });
  }
  if (argv['prep-all']) {
    const prepared = await api.prep(argv['prep-context']);
    await api.prepCiDeno();
    await api.prepCi({
      versionFilter: argv['ahead-only'] ? 'ahead' : 'all',
      prepared,
      final: true,
      ensureGraph: false,
    });
  }
  if (argv['prep-ci']) await api.prepCi({ versionFilter: argv['ahead-only'] ? 'ahead' : 'all' });
  if (argv['prep-ci-deno']) await api.prepCiDeno();
}

/**
 * Main entry:
 */
if (import.meta.main) {
  const argv = Args.parse<MainArgs>(Deno.args, {
    boolean: [
      'dry',
      'test',
      'info',
      'clean',
      'lint',
      'bump',
      'prep',
      'prep-all',
      'prep-bump',
      'prep-pkg',
      'prep-ci',
      'prep-ci-deno',
      'ahead-only',
      'tmpl',
    ],
  });
  await run(argv);
  Deno.exit(0);
}
