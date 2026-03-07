import { Cli } from './u.ts';

import { main as bump } from './task.bump.ts';
import { main as clean } from './task.clean.ts';
import { main as dry } from './task.dry.ts';
import { main as info } from './task.info.ts';
import { main as lint } from './task.lint.ts';
import { main as prepCi } from './task.prep.ci.ts';
import { main as prepCiDeno } from './task.prep.ci.deno.ts';
import { main as prep } from './task.prep.ts';
import { main as test } from './task.test.ts';

type T = {
  dry?: boolean;
  test?: boolean;
  info?: boolean;

  clean?: boolean;
  lint?: boolean;
  bump?: boolean;
  prep?: boolean;
  'prep-ci'?: boolean;
  'prep-ci-deno'?: boolean;

  tmpl?: boolean;
};
const args = Cli.args<T>(Deno.args);

// CI:
if (args.dry) await dry();
if (args.test) await test();
if (args.info) await info();

// Maintenance:
if (args.clean) await clean();
if (args.lint) await lint();
if (args.bump) await bump();
if (args.prep) await prep();
if (args['prep-ci']) await prepCi();
if (args['prep-ci-deno']) await prepCiDeno();

// Finish up.
Deno.exit(0);
