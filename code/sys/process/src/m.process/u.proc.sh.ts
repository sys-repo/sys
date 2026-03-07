import type { t } from './common.ts';
import { invoke } from './u.proc.invoke.ts';

type ShellOptions = t.ShellProcOptions;

/**
 * Build a shell runner. This is sugar over `invoke({ cmd:'sh', args:['-c', <script>] })`.
 */
export const sh: t.ProcLib['sh'] = (...input: unknown[]) => {
  const options = shellOptions(input);
  const path = options.path ?? '';
  return {
    path,
    async run(...args: string[]) {
      const { silent, strict = true } = options;
      const command = [...(options.args ?? []), ...args];
      if (path) command.unshift(`cd ${path}`);

      const lines = [...(strict ? ['set -e'] : []), ...command];
      const script = lines.join(' && ');

      const res = await invoke({ args: ['-c', script], cmd: 'sh', silent });
      return res;
    },
  };
};

/**
 * Normalize `Process.sh` inputs to options.
 */
function shellOptions(input: unknown[]): ShellOptions {
  if (input.length === 0) return {};
  if (typeof input[0] === 'string') return { path: input[0] };
  if (typeof input[0] === 'object') return input[0] as ShellOptions;
  return {};
}
