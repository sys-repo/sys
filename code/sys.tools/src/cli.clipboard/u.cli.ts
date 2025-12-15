import { type t, Args, Cli, D, Fs } from './common.ts';
import { copyDenoFiles, copyFiles, copyTypes } from './u.cli.copy.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.ClipboardToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.VideoTool.CliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

  console.info(await Fmt.header(toolname, cwd));
  await run(cwd);

  console.info();
  console.info(Fmt.signoff(toolname));
};

/**
 * Helpers:
 */
async function run(cwd: t.StringDir) {
  const mode = (await Cli.Prompt.Select.prompt({
    message: 'Select copy mode:\n',
    options: [
      { name: 'Copy Files (select)', value: 'files:select' },
      { name: 'Copy Files (all)', value: 'files:all' },
      { name: 'Copy Types', value: 'types' },
      { name: 'Copy Files: deno.json', value: 'files:deno.json' },
    ],
  })) as t.ClipboardCopyAction;

  if (mode === 'files:select') await copyFiles(cwd, { initial: 'none' });
  else if (mode === 'files:all') await copyFiles(cwd, { initial: 'all' });
  else if (mode === 'types') await copyTypes(cwd, { initial: 'all' });
  else if (mode === 'files:deno.json') await copyDenoFiles(cwd, {});

  return { mode };
}
