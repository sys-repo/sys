import { type t, Args, c, Cli, D, Fs } from './common.ts';
import { Fmt } from './u.fmt.ts';
import { getIndexJson } from './u.index.ts';
import { shutdown } from './u.repo.ts';

import { addDoc, list, removeDoc } from './u.docs.ts';

export const cli: t.CrdtToolsLib['cli'] = async (opts = {}) => {
  const toolname = D.toolname;
  const dir = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.CrdtCliArgs>(opts.argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

  console.info(await Fmt.header(toolname));

  await run(dir);
  await shutdown(dir);
  console.info();
  console.info(Fmt.signoff(toolname));
};

/**
 * Helpers:
 */

async function run(dir: t.StringDir) {
  const options: { name: string; value: t.CrdtCommand }[] = [
    { name: 'sync/backup', value: 'sync' },
    { name: 'add', value: 'add-doc' },
    { name: 'remove (delete locally)', value: 'remove-doc' },
    { name: 'list', value: 'list' },
  ];

  const command = (await Cli.Prompt.Select.prompt({
    message: 'Document options:',
    options,
  })) as t.CrdtCommand;

  const index = await getIndexJson(dir);

  if (command === 'add-doc') return void (await addDoc(index.doc));
  if (command === 'remove-doc') return void (await removeDoc(index.doc, index.repo));
  if (command === 'list') return void (await list(index.doc));

  console.info(c.gray('Nothing selected'));
}
