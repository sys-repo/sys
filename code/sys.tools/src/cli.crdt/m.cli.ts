import { type t, Args, D, Fs, getConfig } from './common.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.CrdtToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  const dir = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.CrdtCliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));


  console.info();
  console.info(Fmt.signoff(toolname));
};
