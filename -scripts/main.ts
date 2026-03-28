import { Args } from './common.ts';

import { main as bump } from './task.bump.ts';
import { main as clean } from './task.clean.ts';
import { main as dry } from './task.dry.ts';
import { main as info } from './task.info.ts';
import { main as lint } from './task.lint.ts';
import { main as prepCi } from './task.prep.ci.ts';
import { main as prepCiDeno } from './task.prep.ci.deno.ts';
import { main as prep } from './task.prep.ts';
import { main as test } from './task.test.ts';

export type MainArgs = {
  dry?: boolean;
  test?: boolean;
  info?: boolean;
  clean?: boolean;
  lint?: boolean;
  bump?: boolean;
  prep?: boolean;
  'prep-all'?: boolean;
  'prep-ci'?: boolean;
  'prep-ci-deno'?: boolean;
  'ahead-only'?: boolean;
  tmpl?: boolean;
};

type Lib = {
  readonly dry: typeof dry;
  readonly test: typeof test;
  readonly info: typeof info;
  readonly clean: typeof clean;
  readonly lint: typeof lint;
  readonly bump: typeof bump;
  readonly prep: typeof prep;
  readonly prepCi: typeof prepCi;
  readonly prepCiDeno: typeof prepCiDeno;
};

const lib: Lib = {
  dry,
  test,
  info,
  clean,
  lint,
  bump,
  prep,
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
  if (argv.prep) await api.prep();
  if (argv['prep-all']) {
    const prepared = await api.prep();
    await api.prepCiDeno();
    await api.prepCi({ versionFilter: argv['ahead-only'] ? 'ahead' : 'all', prepared, final: true });
  }
  if (argv['prep-ci']) await api.prepCi({ versionFilter: argv['ahead-only'] ? 'ahead' : 'all' });
  if (argv['prep-ci-deno']) await api.prepCiDeno();
}

if (import.meta.main) {
  const argv = Args.parse<MainArgs>(Deno.args, {
    boolean: ['dry', 'test', 'info', 'clean', 'lint', 'bump', 'prep', 'prep-all', 'prep-ci', 'prep-ci-deno', 'ahead-only', 'tmpl'],
  });
  await run(argv);
  Deno.exit(0);
}
