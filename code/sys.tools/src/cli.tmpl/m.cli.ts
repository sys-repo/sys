import { type t, D, Fs, Is, done } from './common.ts';
import { parseArgs } from './u.args.ts';
import { Fmt } from './u.fmt.ts';

/**
 * Main entry:
 */
export const cli: t.TmplToolsLib['cli'] = async (cwd, argv) => {
  const args = parseArgs(argv);
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');

  if (args.help) return void console.info(await Fmt.help(toolname, cwd));

  /* Run */
  console.info(await Fmt.header(toolname));
  const res = await run(cwd);
  console.info(Fmt.signoff(toolname));

  /* Exit */
  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(_cwd: t.StringDir): Promise<t.RunReturn> {
  console.info('No local subcommands yet. Use @sys/tmpl directly.');
  return done(0);
}
