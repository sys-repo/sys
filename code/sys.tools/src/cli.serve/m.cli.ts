import { type t, Cli, TmplEngine, Args, c, D, Fs, getConfig, Is, Prompt } from './common.ts';
import { normalize } from './u.config.doc.ts';
import { Fmt } from './u.fmt.ts';

/**
 * Main entry:
 */
export const cli: t.ServeToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  const dir = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.ServeCliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname, dir));

  console.info(await Fmt.header(toolname));
  const res = await run(dir);
  console.info(Fmt.signoff(toolname));

  const exit = res.exit === true ? 0 : Is.num(res.exit) ? res.exit : -1;
  if (exit > -1) Deno.exit(exit);
};

/**
 * Execution:
 */
async function run(dir: t.StringDir): Promise<t.RunReturn> {
  const config = await getConfig(dir);
  await normalize(config);
  const done = (exit: number | boolean = false): t.RunReturn => ({ exit });

  console.info();
  const A = (await Prompt.Select.prompt<t.ServeCommand>({
    message: 'Choose:\n',
    options: [{ name: 'add: <directory>', value: 'modify:add' }],
  })) as t.ServeCommand;

  console.log(`-------------------------------------------`);
  console.log('A', A);

  return done();
}
