import { type t, Args, Fs } from './common.ts';
import { runUpdate } from './u.cmd.runUpdate.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.UpdateToolsLib['cli'] = async (cwd, argv) => {
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.UpdateTool.CliArgs>(argv, { alias: { h: 'help', l: 'latest' } });

  const runHelp = async () => console.info(await Fmt.help());
  if (args.help) return void (await runHelp());

  if (args.latest) return void (await runUpdate(cwd, { interactive: false }));
  return void (await runUpdate(cwd, { interactive: true }));
};
