import * as t from '@sys/types/t';

import { c, Cli } from '@sys/cli';
import { Obj, Str } from '@sys/std';
import { Time } from '@sys/std/time';
import { Is } from '@sys/std/is';
import { slug } from '@sys/std/random';
import { Fs } from '@sys/fs';
import { Crdt } from '@sys/driver-automerge/fs';
import { CrdtRef } from '@sys/driver-automerge/t';

const root = './-backup';
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
 * Process a CRDT
 */
async function process(
  id: t.StringId,
  opts: { dir?: t.StringDir; depth?: number; processed?: t.StringId[] } = {},
) {
  const { depth = 0, processed = [] } = opts;
  const dir = opts.dir ?? Fs.join(root, 'snapshots', `${now}.${slug()}`);
  id = cleanId(id);
  const done = () => ({ dir });
  if (processed.includes(id)) return done();

  // Retrieve document.
  repo.whenReady();
  const { doc, ok } = await repo.get(id);
  if (!ok) {
    console.warn(c.yellow(`Failed to retrieve crdt:${c.white(id)}`));
    return done();
  }
  if (!Obj.isRecord(doc.current)) {
    console.info(`crdt:${id} current is not an object`);
    return done();
  }

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

    const stats = await Fs.stat(out);
    const size = stats?.size ?? 0;

    console.info(c.gray(`  ${dir}/${c.green(filename)} - ${Str.bytes(size)}`));
  }

  return done();
}

async function run(id: t.StringId) {
  console.info();
  console.info(c.cyan('Snapshot'));
  console.info(c.gray(`entry: crdt:${c.white(id.slice(0, -5))}${c.green(id.slice(-5))}`));
  const { dir } = await process(id);
  console.info();
  console.info(c.gray(`Total ${String(await Fs.Size.dir(dir))}`));
}

await run(ID.program);

await repo.dispose();
Deno.exit(0);
