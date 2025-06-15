import { c, Cli } from '@sys/cli';
import { Crdt } from '@sys/driver-automerge/fs';

const path = '.tmp/sync.crdt';
const repo = Crdt.repo(path);

const id = '3YxRXmu8TcBs3SZmy43vRVNibqte';
const doc = await repo.get(id);

const table = Cli.table([]);
table.push([c.gray('path:'), c.gray(path)]);
table.push([c.gray('doc.id:'), c.green(id)]);
table.push([c.gray('doc:')]);

console.info('\n🌳');
console.info(table.toString().trim());
console.info(doc?.current);
console.info();
