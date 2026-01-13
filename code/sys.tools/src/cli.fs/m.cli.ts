import { type t, Args, Cli, D, Fs } from './common.ts';
import {
  listFileHashes,
  removeRenamedSh256Files as removeRenamedSha256Files,
  selectFilesAndRenameToHash,
  tidySha256Files,
} from './u.cmd.hash.ts';
import { Fmt } from './u.fmt.ts';

/**
 * Main entry:
 */
export const cli: t.FsToolsLib['cli'] = async (cwd, argv) => {
  const toolname = D.tool.name;
  cwd = cwd ?? Fs.cwd('terminal');
  const args = Args.parse<t.FsTool.CliArgs>(argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

  console.info(await Fmt.header(toolname, cwd));
  await run(cwd);

  console.info();
  console.info(Fmt.signoff(toolname));
};

/**
 * Execution:
 */
async function run(cwd: t.StringDir) {
  const mode = (await Cli.Input.Select.prompt({
    message: 'Select file-system operation:\n',
    options: [
      { name: 'Hash: List file hashes', value: 'hash:list' },
      { name: 'Hash: Rename files → <filename>-sha-256.<ext>', value: 'hash:rename-sha256' },
      { name: 'Hash: Tidy sha-256 files to folder: -sha256', value: 'hash:tidy-sha256-files' },
      { name: 'Hash: Remove generated sha-256 files', value: 'hash:remove-renamed-sha256' },
    ],
  })) as t.FsCommand;

  if (mode === 'hash:list') await listFileHashes(cwd);
  if (mode === 'hash:rename-sha256') await selectFilesAndRenameToHash(cwd);
  if (mode === 'hash:tidy-sha256-files') await tidySha256Files(cwd);
  if (mode === 'hash:remove-renamed-sha256') await removeRenamedSha256Files(cwd);
}
