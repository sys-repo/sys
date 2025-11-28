import { type t, Args, D, Fs } from './common.ts';
import { runUpdate } from './u.cmd.runUpdate.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.UpdateToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.toolname;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.UpdateCliArgs>(argv, { alias: { h: 'help', l: 'latest' } });

  const runHelp = async () => console.info(await Fmt.help(toolname));

  if (args.help) return void (await runHelp());
  if (args.latest) return void (await runUpdate(cwd));

  void (await runHelp());
};
