import { type t, c, Cli } from './common.ts';
import { sync } from './u.crdt.doc.sync.ts';
import { addDoc, list, removeDoc } from './u.crdt.doc.ts';
import { removeEmpty } from './u.crdt.mutate.ts';
import { Fmt } from './u.fmt.ts';
import { getIndexJson } from './u.index.ts';
import { keepAlive } from './u.keepAlive.ts';

/**
 * Run CLI:
 */
type T = { exit?: boolean | number };
export async function run(dir: t.StringDir, repo: t.Crdt.Repo): Promise<T> {
  const done = (res: T = { exit: false }): T => res;

  const prompt = async (message: string, options: Opt[]) => {
    return (await Cli.Prompt.Select.prompt({ message, options })) as t.CrdtCommand;
  };

  type Opt = { name: string; value: t.CrdtCommand };
  let command = await prompt('Action:', [
    { name: '- sync/save', value: 'sync' },
    { name: '- list', value: 'list' },
    { name: '- modify', value: 'modify' },
    { name: '- help', value: 'help' },
    { name: '- quit', value: 'quit' },
  ]);
  if (command === 'modify') {
    command = await prompt('Modification', [
      { name: '- add', value: 'add-doc' },
      { name: '- delete (locally)', value: 'remove-doc' },
    ]);
  }

  const index = await getIndexJson(dir, repo);
  index.doc?.change(removeEmpty);

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
    return done();
  }
  if (command === 'help') {
    console.info(await Fmt.help());
    return done();
  }
  if (command === 'quit') {
    return done({ exit: true });
  }

  return done();
}
