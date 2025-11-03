import { type t, Args, Cli, Fs } from './common.ts';
import { copyDenoFiles, copyFiles, copyTypes } from './u.cli.copy.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.ClipboardCliLib['cli'] = async (opts = {}) => {
  const toolname = 'Clipboard Tools';
  const dir = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.VideoCliArgs>(opts.argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

  console.info();
  console.info(await Fmt.header(toolname, dir));
  console.info();

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
      { name: 'Copy Files (select)', value: 'files:select' as const },
      { name: 'Copy Files (all)', value: 'files:all' as const },
      { name: 'Copy Types', value: 'types' as const },
      { name: 'Copy Files: deno.json', value: 'files:deno.json' as const },
    ],
  })) as t.ClipboardCopyAction;

  if (mode === 'files:select') await copyFiles(dir, { initial: 'none' });
  else if (mode === 'files:all') await copyFiles(dir, { initial: 'all' });
  else if (mode === 'types') await copyTypes(dir, { initial: 'all' });
  else if (mode === 'files:deno.json') await copyDenoFiles(dir, {});

  return { mode };
}
