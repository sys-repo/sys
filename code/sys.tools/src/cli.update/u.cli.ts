import { type t, Args, Cli, D, Fs, pkg } from './common.ts';
import { runUpdate } from './u.cmd.runUpdate.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.UpdateToolsLib['cli'] = async (opts = {}) => {
  const toolname = D.toolname;
  const cwd = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.UpdateCliArgs>(opts.argv, { alias: { h: 'help', l: 'latest' } });

  const runHelp = async () => console.info(await Fmt.help(toolname));

  if (args.help) return void (await runHelp());
  if (args.latest) {
    return void (await runUpdate({ cwd }));
  }

  void (await runHelp());
};
