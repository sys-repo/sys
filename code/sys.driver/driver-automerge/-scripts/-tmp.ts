import { c, Cli } from '@sys/cli';
import { Crdt } from '@sys/driver-automerge/fs';

const print = () => {
  console.clear();

  const table = Cli.table([]);
  table.push([c.gray('  path:'), c.gray(dir)]);
  table.push([c.gray('  doc.id:'), c.green(id)]);
  table.push([c.gray('  doc:')]);

  console.info('🌳');
  console.info(table.toString().trim());
  console.info();
  console.info(doc?.current);
  console.info();
};

/**
 * Pull document:
 */
const dir = '.tmp/sync.crdt';
const repo = Crdt.repo({ dir, network: { ws: 'sync.db.team' } });

const id = '6EYQPyrnUw8BYR4vffMcotnrcAn';
const doc = await repo.get(id);

doc?.events().changed$.subscribe(print);
print();
