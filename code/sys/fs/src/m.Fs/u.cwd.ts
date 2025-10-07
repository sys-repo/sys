import type { t } from './common.ts';

/**
 * Current Working Directory:
 * https://docs.deno.com/runtime/reference/cli/task/#specifying-the-current-working-directory
 */
export const cwd: t.FsLib['cwd'] = (kind = 'process') => {
  if (kind === 'terminal') return Deno.env.get('INIT_CWD') ?? Deno.cwd();
  return Deno.cwd();
};
