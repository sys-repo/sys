import { type t, Fs, Is, Obj, Str, Time, c, slug } from '../common.ts';

const isCrdtUri = (value?: string) => (value || '').trim().startsWith('crdt:');
const cleanId = (input: string) => (input || '').trim().replace(/^crdt\:/, '');

/**
 * Process ("walk") a CRDT reference chain saving each
 * linked "crdt:id" document reference bound in the
 * object-tree.
 */
export async function process(args: {
  repo: t.Crdt.Repo;
  id: t.StringId;
  root: t.StringDir;
  //
  dir?: t.StringDir;
  depth?: number;
  now?: t.UnixTimestamp;
  processed?: t.StringId[];
}) {
  const { root, depth = 0, processed = [], repo } = args;
  const now = args.now ?? Time.now.timestamp;
  const dir = args.dir ?? Fs.join(root, 'snapshots', `${now}.${slug()}`);
  const id = cleanId(args.id);
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
    await process({ repo, id, root, dir, now, processed, depth: depth + 1 }); // 🌳 ← recursion
  }

  async function save(dir: t.StringDir, doc: t.Crdt.Ref, isRoot: boolean) {
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
