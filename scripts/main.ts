import { Cli } from './u.ts';

import { main as bump } from './Task.-bump.ts';
import { main as clean } from './Task.-clean.ts';
import { main as dry } from './Task.-dry.ts';
import { main as info } from './Task.-info.ts';
import { main as lint } from './Task.-lint.ts';
import { main as prep } from './Task.-prep.ts';
import { main as test } from './Task.-test.ts';

type T = {
  dry?: boolean;
  test?: boolean;
  clean?: boolean;
  info?: boolean;
  lint?: boolean;
  bump?: boolean;
  prep?: boolean;
};
const args = Cli.args<T>(Deno.args);

// Maintenance.
if (args.clean) await clean();
if (args.lint) await lint();
if (args.bump) await bump();
if (args.prep) await prep();

// CI.
if (args.dry) await dry();
if (args.test) await test();
if (args.info) await info();

// Finish up.
Deno.exit(0);
