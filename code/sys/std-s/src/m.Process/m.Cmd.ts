import type { t } from './common.ts';
import { spawn } from './m.Cmd.spawn.ts';
import { Wrangle, printOutput, toCmdOutput } from './u.ts';

/**
 * Unix child process.
 * https://docs.deno.com/api/deno/~/Deno.Command
 */
export const Cmd: t.Cmd = {
  /**
   * Run an <shell> command.
   * When using grant the "--allow-run=sh" permission argument.
   */
  sh(...input: unknown[]) {
    const options = wrangle.shellOptions(input);
    const path = options.path ?? '';
    return {
      path,
      run(...args) {
        const { silent } = options;
        const command = [...(options.args ?? []), ...args];
        if (path) command.unshift(`cd ${path}`);
        return Cmd.invoke({ args: ['-c', command.join(' && ')], cmd: 'sh', silent });
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
    const res = toCmdOutput(output);
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
  shellOptions(input: unknown[]): t.ShellCmdOptions {
    if (input.length === 0) return {};
    if (typeof input[0] === 'string') return { path: input[0] };
    if (typeof input[0] === 'object') return input[0] as t.ShellCmdOptions;
    return {};
  },
} as const;
