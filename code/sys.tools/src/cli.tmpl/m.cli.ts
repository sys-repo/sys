import { type t, Fs, Is, Process } from './common.ts';

/**
 * Main entry:
 */
export const cli: t.TmplToolsLib['cli'] = async (cwd, argv) => {
  cwd = cwd ?? Fs.cwd('terminal');
  argv = argv ?? [];
  const res = await run(cwd, argv);
  if (!res.success && Is.num(res.code)) Deno.exitCode = res.code;
};

/**
 * Execution:
 */
async function run(cwd: t.StringDir, argv: string[]) {
  return await Process.inherit({
    cwd,
    args: ['run', '-A', 'jsr:@sys/tmpl', ...argv],
  });
}
