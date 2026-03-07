import { type t, Crdt, Fs, Is, slug, Time, Num } from '../common.ts';
import { makeDiscoverRefs } from '../cmd.doc.graph/mod.ts';
import { saveDoc } from './u.saveDoc.ts';

type Args = {
  cmd: t.Crdt.Cmd.Client;
  id: t.Crdt.Id;
  base: t.StringDir;
  yamlPath: t.ObjectPath;
  now?: t.UnixTimestamp;
  onProgress?: (e: t.CrdtSnapshotProgress) => void;
};

export type ProcessResult = {
  readonly dir: t.StringDir;
  readonly processed: readonly t.Crdt.Id[];
  readonly bytes: { json: number; binary: number };
};

/**
 * Process ("walk") a CRDT reference chain saving each
 * linked document found in the object-tree.
 *
 * Delegates DAG traversal to `Crdt.Graph.walk`.
 */
export async function walk(args: Args): Promise<ProcessResult> {
  const { base, cmd, onProgress } = args;

  const now = args.now ?? Time.now.timestamp;
  const root = args.id;
  const dir = Fs.join(base, `crdt.${root}`, `snap.${now}.${slug().slice(3)}`);

  const bytes: { json: number[]; binary: number[] } = { json: [], binary: [] };
  const processed: t.Crdt.Id[] = [];

  const emit = (event: t.CrdtSnapshotProgress) => onProgress?.(event);
  emit({ kind: 'start', root, dir, timestamp: now });

  await Crdt.Graph.walk({
    id: root,
    processed,
    async load(doc) {
      const res = await cmd.send('doc:read', { doc });
      const current = Is.record(res.value) ? res.value : undefined;
      return current ? { current } : undefined;
    },

    /**
     * Per-document handler: persist a JSON snapshot and track size.
     */
    async onDoc({ id, depth }) {
      await saveDoc({ cmd, dir, root, doc: id, depth, bytes, emit });
    },

    /**
     * Skip handler: surface reasons as snapshot progress events.
     */
    onSkip({ id, reason }) {
      emit({ kind: 'doc:skip', id, reason });
    },

    /**
     * Ref handlers.
     */
    discoverRefs: makeDiscoverRefs(args.yamlPath),
    onRefs({ id, refs }) {
      emit({ kind: 'doc:refs', id, refs });
    },
  });

  // Finish up:
  emit({ kind: 'complete', root, dir, processed });
  return {
    dir,
    processed,
    bytes: {
      json: Num.sum(bytes.json),
      binary: Num.sum(bytes.binary),
    },
  };
}
