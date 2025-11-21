import { type t, Args, c, D, Fs, getConfig, Is, Prompt } from './common.ts';
import { normalize } from './u.config.doc.ts';
import { Fmt } from './u.fmt.ts';

/**
 * Main entry:
 */
export const cli: t.__NAME__ToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  const dir = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.__NAME__CliArgs>(argv, { alias: { h: 'help' } });
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
  const A = (await Prompt.Select.prompt<t.__NAME__Command>({
    message: 'Choose:\n',
    options: [
      { name: 'Option A', value: 'option-a' },
      { name: 'Option B', value: 'option-b' },
    ],
  })) as t.__NAME__Command;

  if (A === 'option-a') {
    // 🐷 TODO
    console.log('🐷 A:', A);
    return done();
  }

  const B = (await Prompt.Select.prompt<t.__NAME__Command>({
    // 🐷 TODO
    message: `with:`,
    options: [
      { name: 'Option Ba', value: 'option-ba' },
      { name: 'Option Bb', value: 'option-bb' },
    ],
  })) as t.__NAME__Command;

  if (B === 'option-ba') {
    // 🐷 todo
    console.log('🐷 B:', B);
    return done(0);
  }

  if (B === 'option-bb') {
    // 🐷 todo
    console.log('🐷 B:', B);
    return done(0);
  }

  return done();
}
