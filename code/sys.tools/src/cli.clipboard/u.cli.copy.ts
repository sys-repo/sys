import { type t } from './common.ts';
import { copyFiles } from './u.cli.copy.files.ts';

export * from './u.cli.copy.files.ts';
export * from './u.cli.copy.types.ts';
export * from './u.cli.copy.git.ts';

/**
 * Sub-command: Copy deno.json files
 */
export async function copyDenoFiles(cwd: t.StringDir, options: { initial?: 'none' | 'all' } = {}) {
  const { initial = 'all' } = options;
  await copyFiles(cwd, {
    initial,
    filter: (file) => file.name === 'deno.json',
  });
}
