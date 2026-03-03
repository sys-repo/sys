import { type t, Fs, Is, Process } from './common.ts';

/**
 * Main entry.
 *
 * Delegates all argv/cwd handling to `@sys/tmpl`.
 */
export const cli: t.TmplToolsLib['cli'] = async (cwd, argv) => {
  cwd = cwd ?? Fs.cwd('terminal');
  argv = argv ?? [];
  const res = await run(cwd, argv);
  if (!res.success && Is.num(res.code)) Deno.exitCode = res.code;
};

/**
 * Execute delegated CLI process with inherited stdio.
 */
async function run(cwd: t.StringDir, argv: string[]) {
  return await Process.inherit({
    cwd,
    args: ['run', '-A', 'jsr:@sys/tmpl', ...argv],
  });
}
