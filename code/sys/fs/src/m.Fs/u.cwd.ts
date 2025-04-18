import { type t, exists, Path, Err } from './common.ts';

/**
 * Current Working Directory:
 * https://docs.deno.com/runtime/reference/cli/task/#specifying-the-current-working-directory
 */
export const cwd: t.FsLib['cwd'] = (kind) => {
  if (kind === 'init') return Deno.env.get('INIT_CWD') ?? Deno.cwd();
  return Deno.cwd();
};
