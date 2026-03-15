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

type MainArgs = {
  dry?: boolean;
  test?: boolean;
  info?: boolean;
  clean?: boolean;
  lint?: boolean;
  bump?: boolean;
  prep?: boolean;
  'prep-ci'?: boolean;
  'prep-ci-deno'?: boolean;
  'ahead-only'?: boolean;
  tmpl?: boolean;
};

const argv = Args.parse<MainArgs>(Deno.args, {
  boolean: ['dry', 'test', 'info', 'clean', 'lint', 'bump', 'prep', 'prep-ci', 'prep-ci-deno', 'ahead-only', 'tmpl'],
});

// CI:
if (argv.dry) await dry();
if (argv.test) await test();
if (argv.info) await info();

// Maintenance:
if (argv.clean) await clean();
if (argv.lint) await lint();
if (argv.bump) await bump();
if (argv.prep) await prep();
if (argv['prep-ci']) await prepCi({ versionFilter: argv['ahead-only'] ? 'ahead' : 'all' });
if (argv['prep-ci-deno']) await prepCiDeno();

// Finish up.
Deno.exit(0);
