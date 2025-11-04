import { type t, Args, Cli, D, Fs } from './common.ts';
import {
  listFileHashes,
  removeRenamedSh256Files as removeRenamedSha256Files,
  selectFilesAndRenameToHash,
  tidySha256Files,
} from './u.cmd.hx.ts';
import { Fmt } from './u.fmt.ts';

export const cli: t.FsToolsLib['cli'] = async (opts = {}) => {
  const toolname = D.toolname;
  const dir = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.FsCliArgs>(opts.argv, { alias: { h: 'help' } });
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
      { name: 'Hash: Rename files → <filename>-sha-256.<ext>', value: 'hash:rename-sha256' },
      { name: 'Hash: Tidy sha-256 files to folder: -sha256', value: 'hash:tidy-sha256-files' },
      { name: 'Hash: Remove generated sha-256 files', value: 'hash:remove-renamed-sha256' },
    ],
  })) as t.FsCommand;

  if (mode === 'hash:list') await listFileHashes(dir);
  if (mode === 'hash:rename-sha256') await selectFilesAndRenameToHash(dir);
  if (mode === 'hash:tidy-sha256-files') await tidySha256Files(dir);
  if (mode === 'hash:remove-renamed-sha256') await removeRenamedSha256Files(dir);

  return { mode };
}
