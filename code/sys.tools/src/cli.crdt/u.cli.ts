import { type t, Args, c, Cli, Crdt, D, Fs, Is, Time } from './common.ts';
import { sync } from './u.crdt.doc.sync.ts';
import { addDoc, list, removeDoc } from './u.crdt.doc.ts';
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

  const res = await run(dir, repo);
  console.info(Fmt.signoff(toolname));

  // Shutdown:
  await Time.wait(0);
  await repo.dispose();
  if (res.exit) Deno.exit(Is.number(res.exit) ? res.exit : 0);
};

/**
 * Helpers:
 */
type T = { exit?: boolean | number };
async function run(dir: t.StringDir, repo: t.Crdt.Repo): Promise<T> {
  const done = (exit: T['exit'] = false): T => {
    return { exit };
  };

  const options: { name: string; value: t.CrdtCommand }[] = [
    { name: 'sync/backup', value: 'sync' },
    { name: 'add', value: 'add-doc' },
    { name: 'delete (locally)', value: 'remove-doc' },
    { name: 'list', value: 'list' },
    { name: 'help', value: 'help' },
  ];

  const command = (await Cli.Prompt.Select.prompt({
    message: 'Document options:',
    options,
  })) as t.CrdtCommand;

  const index = await getIndexJson(dir, repo);

  if (command === 'sync') {
    await keepAlive(async (until) => sync(index.doc, repo, until));
  }
  if (command === 'add-doc') {
    await addDoc(index.doc);
    return done();
  }
  if (command === 'remove-doc') {
    await removeDoc(index.doc, index.repo);
    return done();
  }
  if (command === 'list') {
    await list(index.doc);
    return done(true);
  }
  if (command === 'help') {
    console.info(await Fmt.help());
    return done(true);
  }

  console.info(c.gray('Nothing selected'));
  return done();
}
