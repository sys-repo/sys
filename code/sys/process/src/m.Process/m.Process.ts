import type { t } from './common.ts';
import type { ProcLib } from './t.ts';

import { spawn } from './m.Process.spawn.ts';
import { Wrangle, printOutput, toProcOutput } from './u.ts';

/**
 * Unix child process.
 * https://docs.deno.com/api/deno/~/Deno.Command
 */
export const Process: ProcLib = {
  Signal: { ready: 'PROCESS_READY' },

  /**
   * Run an <shell> command.
   * When using grant the "--allow-run=sh" permission argument.
   */
  sh(...input: unknown[]) {
    const options = wrangle.shellOptions(input);
    const path = options.path ?? '';
    return {
      path,
      async run(...args) {
        const { silent, strict = true } = options;
        const command = [...(options.args ?? []), ...args];
        if (path) command.unshift(`cd ${path}`);

        const lines = [...(strict ? ['set -e'] : []), ...command];
        const script = lines.join(' && ');

        const res = await Process.invoke({ args: ['-c', script], cmd: 'sh', silent });
        return res;
      },
    };
  },

  /**
   * Run a <unix> command (on spawned child process).
   */
  async invoke(config) {
    const { silent } = config;
    const command = Wrangle.command(config);
    const output = await command.output();
    const res = toProcOutput(output);
    if (!silent) printOutput(res.code, res.stdout, res.stderr);
    return res;
  },

  /**
   * Spawn a long running <unix> command on a child-process.
   */
  spawn,
} as const;

/**
 * Helpers
 */
const wrangle = {
  shellOptions(input: unknown[]): t.ShellProcOptions {
    if (input.length === 0) return {};
    if (typeof input[0] === 'string') return { path: input[0] };
    if (typeof input[0] === 'object') return input[0] as t.ShellProcOptions;
    return {};
  },
} as const;
