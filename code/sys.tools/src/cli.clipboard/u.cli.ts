import { type t, Args, Cli, D, Fs } from './common.ts';
import { copyDenoFiles, copyFiles, copyTypes } from './u.cli.copy.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.ClipboardToolsLib['cli'] = async (opts = {}) => {
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
      { name: 'Copy Files (select)', value: 'files:select' },
      { name: 'Copy Files (all)', value: 'files:all' },
      { name: 'Copy Types', value: 'types' },
      { name: 'Copy Files: deno.json', value: 'files:deno.json' },
    ],
  })) as t.ClipboardCopyAction;

  if (mode === 'files:select') await copyFiles(dir, { initial: 'none' });
  else if (mode === 'files:all') await copyFiles(dir, { initial: 'all' });
  else if (mode === 'types') await copyTypes(dir, { initial: 'all' });
  else if (mode === 'files:deno.json') await copyDenoFiles(dir, {});

  return { mode };
}
