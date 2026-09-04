import type { t } from './common.ts';

import { Port } from './m.Port.ts';
import { Script } from './m.Script.ts';
import { Terminate } from './m.Terminate.ts';
import { isRunning } from './u/u.pid.ts';
import { stdout } from './u/u.stdout.ts';
import { capture } from './u.proc/u.capture.ts';
import { inherit } from './u.proc/u.inherit.ts';
import { invoke, invokeDetached } from './u.proc/u.invoke.ts';
import { run } from './u.proc/u.run.ts';
import { sh } from './u.proc/u.sh.ts';
import { spawn } from './u.proc/u.spawn.ts';

/**
 * Host and child process capabilities.
 * https://docs.deno.com/api/deno/~/Deno.Command
 */
export const Process: t.Process.Lib = Object.freeze({
  Script,
  Signal: Object.freeze({ ready: 'PROCESS_READY' }),
  stdout,
  isRunning,
  Port,
  Terminate,
  invoke,
  capture,
  inherit,
  invokeDetached,
  spawn,
  sh,
  run,
});
