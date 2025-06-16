import { c, Cli } from '@sys/cli';
import { Crdt } from '@sys/driver-automerge/fs';

/**
 * Pull document:
 */
const dir = '.tmp/sync.crdt';
const repo = Crdt.repo({ dir, network: { ws: 'sync.db.team' } });

const id = '6EYQPyrnUw8BYR4vffMcotnrcAn';
const doc = await repo.get(id);

/**
 * Listen and print:
 */
const print = (options: { clear?: boolean } = {}) => {
  const { clear = true } = options;
  if (clear) console.clear();

  const table = Cli.table([]);
  table.push([c.gray('  path:'), c.gray(dir)]);
  table.push([c.gray('  doc.id:'), c.green(id)]);
  table.push([c.gray('  doc:')]);

  if (!clear) console.info();
  console.info('🌳');
  console.info(table.toString().trim());
  console.info();
  console.info(doc?.current);
  console.info();
};

doc?.events().changed$.subscribe(() => print());
print();
