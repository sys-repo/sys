import * as t from '@sys/types/t';

import { c, Cli } from '@sys/cli';
import { Time, slug, Is, Obj } from '@sys/std';
import { Fs } from '@sys/fs';
import { Crdt } from '@sys/driver-automerge/fs';
import { CrdtRef } from '@sys/driver-automerge/t';

const root = '.tmp/backup';
const ID = {
  program: '28k1CyQUNXnx74LhBoyvP2kif4GF',
};

const repo = Crdt.repo({
  dir: Fs.join(root, 'repo.crdt'),
  network: [{ ws: 'waiheke.sync.db.team' }],
});

const now = Time.now.timestamp;
const isCrdtUri = (value?: string) => (value || '').trim().startsWith('crdt:');
const cleanId = (input: string) => (input || '').trim().replace(/^crdt\:/, '');

/**
 * Save a CRDT snapshot.
 */

/**
 * Process a CRDT
 */
async function process(
  id: t.StringId,
  opts: { dir?: t.StringDir; depth?: number; processed?: t.StringId[] } = {},
) {
  const { depth = 0, processed = [] } = opts;
  const dir = opts.dir ?? Fs.join(root, 'snapshots', `${now}.${slug()}`);
  id = cleanId(id);
  if (processed.includes(id)) return;

  // Retrieve document.
  repo.whenReady();
  const { doc, ok } = await repo.get(id);
  if (!ok) return void console.warn(c.yellow(`Failed to retrieve crdt:${c.white(id)}`));
  if (!Obj.isRecord(doc.current)) return void console.info(`crdt:${id} current is not an object`);

  // Save snapshot:
  if (!processed.includes(id)) {
    await save(dir, doc, depth === 0);
    processed.push(id);
  }

  const refs: t.StringId[] = [];
  Obj.walk(doc?.current, (e) => {
    if (!Is.string(e.value)) return;
    if (!isCrdtUri(e.value)) return;
    refs.push(cleanId(e.value));
  });

  for (const id of refs) {
    await process(id, { dir, processed, depth: depth + 1 }); // 🌳 ← recursion
  }

  async function save(dir: t.StringDir, doc: CrdtRef, isRoot: boolean) {
    let filename = `crdt.${doc.id}.json`;
    filename = isRoot ? `-root.${filename}` : filename;
    const out = Fs.join(dir, filename);
    await Fs.writeJson(out, (doc.current ?? {}) as t.JsonMap);
    console.info(c.gray(`  ${dir}/${c.green(filename)}`));
  }
}

console.info();
console.info(c.cyan('Snapshot'));
await process(ID.program);
console.info();

await repo.dispose();
Deno.exit(0);
