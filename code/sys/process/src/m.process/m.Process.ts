import type { t } from './common.ts';

import { Port } from './m.Port.ts';
import { Script } from './m.Script.ts';
import { Terminate } from './m.Terminate.ts';
import { isRunning } from './u.pid.ts';
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
  isRunning,
  Port,
  Terminate,
  invoke,
  inherit,
  invokeDetached,
  spawn,
  sh,
  run,
};
