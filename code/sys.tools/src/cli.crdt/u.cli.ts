import { type t, Args, Cli, D, Fs } from './common.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.CrdtToolsLib['cli'] = async (opts = {}) => {
  const toolname = D.toolname;
  const dir = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.CrdtCliArgs>(opts.argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

};
