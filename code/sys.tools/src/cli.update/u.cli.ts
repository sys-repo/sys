import { type t, Args, Cli, D, Fs } from './common.ts';
import { listFileHashes } from './u.cmd.hx.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.UpdateToolsLib['cli'] = async (opts = {}) => {
  const toolname = D.toolname;
  const dir = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.UpdateCliArgs>(opts.argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

  console.info(await Fmt.header(toolname, dir, { fileTree: { maxDepth: 1 } }));
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
      { name: 'Hash: List file hashes', value: 'hash:list' },
    ],
  })) as t.UpdateCommand;


  return { mode };
}
