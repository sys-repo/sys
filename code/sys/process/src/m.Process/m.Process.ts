import type { t } from './common.ts';

import { invoke } from './u.proc.invoke.ts';
import { sh } from './u.proc.sh.ts';
import { spawn } from './u.proc.spawn.ts';

/**
 * Unix child process.
 * https://docs.deno.com/api/deno/~/Deno.Command
 */
export const Process: t.ProcLib = {
  Signal: { ready: 'PROCESS_READY' },
  invoke,
  spawn,
  sh,
};
