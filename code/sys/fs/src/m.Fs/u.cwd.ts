import type { t } from './common.ts';

/**
 * Current Working Directory:
 * https://docs.deno.com/runtime/reference/cli/task/#specifying-the-current-working-directory
 *
 * `terminal` uses the pseudo-standard `INIT_CWD` env var when present so
 * delegated child processes can preserve the caller's original terminal cwd.
 */
export const cwd: t.Fs.Lib['cwd'] = (kind = 'process') => {
  if (kind === 'terminal') return Deno.env.get('INIT_CWD') ?? Deno.cwd();
  return Deno.cwd();
};
