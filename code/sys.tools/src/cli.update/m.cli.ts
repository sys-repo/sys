import { Args, Fs, type t } from './common.ts';
import { runUpdate } from './u.cmd.runUpdate.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.UpdateToolsLib['cli'] = async (cwd, argv, context) => {
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.UpdateTool.CliArgs>(argv ?? [], { alias: { h: 'help', l: 'latest' } });
  const source = context?.origin === 'root-menu' ? 'root-menu' : 'argv';

  const runHelp = async () => console.info(await Fmt.help());
  if (args.help) return void (await runHelp());

  if (args.latest) return await runUpdate(cwd, { interactive: false, source });
  return await runUpdate(cwd, { interactive: true, source });
};
