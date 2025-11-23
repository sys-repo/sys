import { type t, A, Fs, Crdt, toAutomergeHandle } from '../common.ts';

/**
 * Persist a single document snapshot to disk and record its size.
 */
export async function saveDoc(args: {
  repo: t.Crdt.Repo;
  doc: t.Crdt.Ref;
  dir: t.StringDir;
  depth: number;
  isRoot: boolean;
  bytes: { json: number[]; binary: number[] };
  emit: (e: t.CrdtSnapshotProgress) => void;
}) {
  const { repo, dir, doc, isRoot, bytes, emit, depth } = args;

  const filename = {
    json: `${doc.id}.crdt.json`,
    binary: `${doc.id}.crdt`,
  };

  if (isRoot) {
    filename.json = `-root.${filename.json}`;
    filename.binary = `-root.${filename.binary}`;
  }

  const toDir = (filename: string) => Fs.join(dir, 'pkg', filename);
  const path = {
    json: toDir(filename.json),
    binary: toDir(filename.binary),
  } as const;

  /**
   * Json File:
   */
  const json = (doc.current ?? {}) as t.JsonMap;
  await Fs.writeJson(path.json, json);

  /**
   * Binary File
   */
  const cmd = Crdt.Cmd.fromRepo(repo);
  const res = await cmd.send('save', { doc: doc.id, path: path.binary });

  const toSize = async (path: string) => (await Fs.stat(path))?.size ?? 0;
  const size = {
    json: await toSize(path.json),
    binary: await toSize(path.binary),
  };
  bytes.json.push(size.json);
  bytes.binary.push(size.binary);

  emit({
    kind: 'doc:saved',
    id: doc.id,
    depth,
    dir,
    filename: filename.json,
    path: path.json,
    bytes: size,
    hash: res.hash,
    isRoot,
  });
}
