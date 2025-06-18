import { c, Cli } from '@sys/cli';
import { Crdt } from '@sys/driver-automerge/fs';

// const ws = 'sync.db.team';
const ws = 'localhost:3030';
const dir = '.tmp/sync.crdt';

const print = () => {
  console.clear();

  const table = Cli.table([]);
  table.push([c.gray('  sync:'), c.gray(ws)]);
  table.push([c.gray('  path:'), c.gray(dir)]);
  table.push([c.gray('  doc.id:'), c.green(id)]);
  table.push([c.gray('  doc:')]);

  console.info();
  console.info('  🌳');
  console.info(table.toString().trim());
  console.info();
  console.info(doc?.current);
  console.info();
};

/**
 * Pull document:
 */
const repo = Crdt.repo({ dir, network: ws });
const id = '45BjzPsQM7UJJ66hgsrnF7gsR9D5';
const doc = await repo.get(id);

doc?.events().$.subscribe(print);
print();
