import { type t, Args, c, Cli, Crdt, D, Fs, Time } from './common.ts';
import { sync } from './u.doc.sync.ts';
import { addDoc, list, removeDoc } from './u.doc.ts';
import { Fmt } from './u.fmt.ts';
import { getIndexJson } from './u.index.ts';
import { keepAlive } from './u.keepAlive.ts';

export const cli: t.CrdtToolsLib['cli'] = async (opts = {}) => {
  const toolname = D.toolname;
  const dir = opts.dir ?? Fs.cwd('terminal');
  const args = Args.parse<t.CrdtCliArgs>(opts.argv, { alias: { h: 'help' } });
  if (args.help) return void console.info(await Fmt.help(toolname));

  console.info(await Fmt.header(toolname));

  const ws = D.Sync.server;
  const repo = await Crdt.repo({ network: [{ ws }] }).whenReady();

  await run(dir, repo);
  console.info();
  console.info(Fmt.signoff(toolname));

  // Shutdown:
  await Time.wait(0);
  await repo.dispose();
};

/**
 * Helpers:
 */
async function run(dir: t.StringDir, repo: t.Crdt.Repo) {
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

  const index = await getIndexJson(dir, repo);

  if (command === 'add-doc') return void (await addDoc(index.doc));
  if (command === 'remove-doc') return void (await removeDoc(index.doc, index.repo));
  if (command === 'list') return void (await list(index.doc));
  if (command === 'sync') await keepAlive(async (until) => sync(index.doc, repo, until));

  console.info(c.gray('Nothing selected'));
}
