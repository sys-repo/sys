import { type t, Args, Cli, D, Fs } from './common.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.FsToolsLib['cli'] = async (opts = {}) => {
  const toolname = D.toolname;
  const dir = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.VideoCliArgs>(opts.argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

  console.info(await Fmt.header(toolname, dir));
  await run(dir);

  console.info();
  console.info(Fmt.signoff(toolname));
};

/**
 * Helpers:
 */
async function run(dir: t.StringDir) {
  const mode = (await Cli.Prompt.Select.prompt({
    message: 'Select copy mode:\n',
    options: [
      { name: 'Rename to SHA256', value: 'rename-sha256' },
    ],
  })) as t.FsCommand;


  return { mode };
}
