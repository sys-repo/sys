import { c, Cli } from '@sys/cli';
import { Crdt } from '@sys/driver-automerge/fs';

// const ws = 'localhost:3030';
const ws = 'sync.db.team';
const dir = '.tmp/sync.crdt';

const print = () => {
  console.clear();

  const table = Cli.table([]);
  table.push([c.gray('  sync:'), c.gray(Crdt.Url.ws(ws))]);
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
 * Get ID:
 */
const id = await Cli.Prompt.Input.prompt('document-id:');
if (!id) {
  console.info(c.gray(c.italic('no document-id provided')));
  Deno.exit(0);
}

/**
 * Pull document:
 */
const repo = Crdt.repo({ dir, network: ws });
const doc = (await repo.get(id)).doc;

doc?.events().$.subscribe(print);
print();
