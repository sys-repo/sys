import type { t } from './common.ts';

import { Script } from './m.Script.ts';
import { inherit } from './u.proc.inherit.ts';
import { invoke, invokeDetached } from './u.proc.invoke.ts';
import { run } from './u.proc.run.ts';
import { sh } from './u.proc.sh.ts';
import { spawn } from './u.proc.spawn.ts';

/**
 * Unix child process.
 * https://docs.deno.com/api/deno/~/Deno.Command
 */
export const Process: t.Process.Lib = {
  Script,
  Signal: { ready: 'PROCESS_READY' },
  invoke,
  inherit,
  invokeDetached,
  spawn,
  sh,
  run,
};
