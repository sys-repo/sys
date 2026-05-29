import { Args, Fs, type t } from './common.ts';
import { runUpgrade } from './u.cmd.runUpgrade.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.UpgradeToolsLib['cli'] = async (cwd, argv, context) => {
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.UpgradeTool.CliArgs>(argv ?? [], { alias: { h: 'help', l: 'latest' } });
  const source = context?.origin === 'root-menu' ? 'root-menu' : 'argv';

  const runHelp = async () => console.info(await Fmt.help());
  if (args.help) return void (await runHelp());

  if (args.latest) return await runUpgrade(cwd, { interactive: false, source });
  return await runUpgrade(cwd, { interactive: true, source });
};
