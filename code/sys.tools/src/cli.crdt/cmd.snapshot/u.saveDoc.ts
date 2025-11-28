import { type t, Fs } from '../common.ts';

/**
 * Persist a single document snapshot to disk and record its size.
 */
export async function saveDoc(args: {
  cmd: t.Crdt.Cmd.Client;
  dir: t.StringDir;
  root: t.Crdt.Id;
  doc: t.Crdt.Id;
  depth: number;
  bytes: { json: number[]; binary: number[] };
  emit: (e: t.CrdtSnapshotProgress) => void;
}) {
  const { cmd, dir, doc, bytes, emit, depth } = args;
  const isRoot = args.root === doc;

  const filename = {
    json: `${doc}.crdt.json`,
    binary: `${doc}.crdt`,
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
  const current = (await cmd.send('doc:read', { doc })).value ?? {};
  const json = current as t.JsonMap;
  await Fs.writeJson(path.json, json);

  /**
   * Binary File
   */
  const res = await cmd.send('doc:save', { doc, path: path.binary });

  const toSize = async (path: string) => (await Fs.stat(path))?.size ?? 0;
  const size = {
    json: await toSize(path.json),
    binary: await toSize(path.binary),
  };
  bytes.json.push(size.json);
  bytes.binary.push(size.binary);

  emit({
    kind: 'doc:saved',
    id: doc,
    depth,
    dir,
    filename: filename.json,
    path: path.json,
    bytes: size,
    hash: res.hash,
    isRoot,
  });
}
