import { type t, Args, Cli, D, Fs, Hash } from './common.ts';
import {
  extractSha256Files,
  removeRenamedSh256Files,
  selectFilesAndRenameToHash,
} from './u.cmd.hash.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.FsToolsLib['cli'] = async (opts = {}) => {
  const toolname = D.toolname;
  const dir = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.FsCliArgs>(opts.argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

  console.info(await Fmt.header(toolname));
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
      { name: 'Rename files to SHA-256', value: 'rename-sha256' },
      { name: 'Extract SHA-256 files', value: 'extract-sha256-files' },
      { name: 'Remove renamed SHA-256 files', value: 'remove-renamed-sha256' },
    ],
  })) as t.FsCommand;

  if (mode === 'rename-sha256') await selectFilesAndRenameToHash(dir);
  if (mode === 'extract-sha256-files') await extractSha256Files(dir);
  if (mode === 'remove-renamed-sha256') await removeRenamedSh256Files(dir);

  return { mode };
}
