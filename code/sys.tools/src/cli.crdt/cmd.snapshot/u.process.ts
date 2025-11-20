import { type t, Fs, Is, Obj, Time, slug, Schedule } from '../common.ts';

const isCrdtUri = (value?: string) => (value || '').trim().startsWith('crdt:');
const cleanId = (input: string) => (input || '').trim().replace(/^crdt\:/, '');

/**
 * Sum byte counts.
 */
const sumBytes = (values: readonly number[]) => values.reduce((total, n) => total + n, 0);

type Args = {
  repo: t.Crdt.Repo;
  id: t.StringId;
  base: t.StringDir;
  //
  dir?: t.StringDir;
  depth?: number;
  now?: t.UnixTimestamp;
  processed?: t.StringId[]; // ← internal DAG tracking
  bytes?: number[]; // ← internal byte aggregate
  //
  onProgress?: (e: t.CrdtSnapshotProgress) => void;
};

export type ProcessResult = {
  readonly dir: t.StringDir;
  readonly processed: readonly t.StringId[];
  readonly bytes: number;
};

/**
 * Process ("walk") a CRDT reference chain saving each
 * linked "crdt:id" document reference found in the
 * object-tree.
 */
export async function process(args: Args): Promise<ProcessResult> {
  const { base, depth = 0, processed = [], repo, onProgress } = args;
  const now = args.now ?? Time.now.timestamp;
  const bytes = args.bytes ?? [];

  const emit = (event: t.CrdtSnapshotProgress) => onProgress?.(event);

  const id = cleanId(args.id);
  const isRoot = depth === 0;
  const dir = args.dir ?? Fs.join(base, `crdt.${id}`, `snap.${now}.${slug().slice(3)}`);

  if (isRoot) {
    emit({ kind: 'start', rootId: id, dir, timestamp: now });
  }

  if (processed.includes(id)) {
    emit({ kind: 'doc:skip', id, reason: 'already-processed' });
    return { dir, processed, bytes: sumBytes(bytes) };
  }

  // Retrieve document.
  const { doc, ok } = await repo.get(id);
  if (!ok || !doc) {
    emit({ kind: 'doc:skip', id, reason: 'not-found' });
    return { dir, processed, bytes: sumBytes(bytes) };
  }

  if (!Obj.isRecord(doc.current)) {
    emit({ kind: 'doc:skip', id, reason: 'not-object' });
    return { dir, processed, bytes: sumBytes(bytes) };
  }

  // Save snapshot for this document.
  await saveDoc(dir, doc, isRoot, depth, bytes);
  processed.push(id);

  // Discover referenced CRDT documents.
  const refs: t.StringId[] = [];
  Obj.walk(doc.current, (e) => {
    if (!Is.string(e.value)) return;
    if (!isCrdtUri(e.value)) return;
    refs.push(cleanId(e.value));
  });

  emit({ kind: 'doc:refs', id, refs });

  // Recurse into referenced documents (🌳).
  for (const refId of refs) {
    await process({
      repo,
      id: refId,
      base,
      dir,
      now,
      processed,
      bytes,
      depth: depth + 1,
      onProgress,
    });

    // Give the event-loop a breath so the spinner/UI can repaint between docs.
    await Schedule.macro();
  }

  if (isRoot) {
    emit({ kind: 'complete', rootId: id, dir, processed });
  }

  return { dir, processed, bytes: sumBytes(bytes) };

  async function saveDoc(
    targetDir: t.StringDir,
    docRef: t.Crdt.Ref,
    root: boolean,
    depthValue: number,
    byteAggregate: number[],
  ) {
    let filename = `${docRef.id}.json`;
    if (root) filename = `-root.${filename}`;
    const path = Fs.join(targetDir, filename);

    const json = (docRef.current ?? {}) as t.JsonMap;
    await Fs.writeJson(path, json);

    const stats = await Fs.stat(path);
    const size = stats?.size ?? 0;
    byteAggregate.push(size);

    emit({
      kind: 'doc:saved',
      id: docRef.id,
      depth: depthValue,
      dir: targetDir,
      filename,
      path,
      bytes: size,
      isRoot: root,
    });
  }
}
