import { type t, A, Fs, Crdt, toAutomergeHandle } from '../common.ts';

/**
 * Persist a single document snapshot to disk and record its size.
 */
export async function saveDoc(args: {
  dir: t.StringDir;
  doc: t.Crdt.Ref;
  depth: number;
  isRoot: boolean;
  bytes: number[];
  emit: (e: t.CrdtSnapshotProgress) => void;
}) {
  const { dir, doc, isRoot, bytes, emit, depth } = args;

  let filename = `${doc.id}.crdt.json`;
  if (isRoot) filename = `-root.${filename}`;

  const path = Fs.join(dir, 'pkg', filename);
  const json = (doc.current ?? {}) as t.JsonMap;

  await Fs.writeJson(path, json);

  const stats = await Fs.stat(path);
  const size = stats?.size ?? 0;
  bytes.push(size);

  emit({
    kind: 'doc:saved',
    id: doc.id,
    depth,
    dir,
    filename,
    path,
    bytes: size,
    isRoot,
  });
}
