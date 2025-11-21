import { type t, Crdt, Fs, Time, slug } from '../common.ts';
import { saveDoc } from './u.saveDoc.ts';

const sumBytes = (values: readonly number[]) => values.reduce((total, n) => total + n, 0);

type Args = {
  id: t.Crdt.Id;
  repo: t.Crdt.Repo;
  base: t.StringDir;
  now?: t.UnixTimestamp;
  onProgress?: (e: t.CrdtSnapshotProgress) => void;
};

export type ProcessResult = {
  readonly dir: t.StringDir;
  readonly processed: readonly t.Crdt.Id[];
  readonly bytes: number;
};

/**
 * Process ("walk") a CRDT reference chain saving each
 * linked document found in the object-tree.
 *
 * Delegates DAG traversal to `Crdt.Graph.walk`.
 */
export async function process(args: Args): Promise<ProcessResult> {
  const { base, repo, onProgress } = args;

  const emit = (event: t.CrdtSnapshotProgress) => onProgress?.(event);
  const now = args.now ?? Time.now.timestamp;
  const rootId = args.id;
  const dir = Fs.join(base, `crdt.${rootId}`, `snap.${now}.${slug().slice(3)}`);

  const bytes: number[] = [];
  const processed: t.Crdt.Id[] = [];

  emit({ kind: 'start', rootId, dir, timestamp: now });

  await Crdt.Graph.walk({
    repo,
    id: rootId,
    processed,

    /**
     * Per-document handler: persist a JSON snapshot and track size.
     */
    async onDoc({ depth, doc }) {
      const isRoot = doc.id === rootId;
      await saveDoc({ dir, doc, depth, isRoot, bytes, emit });
    },

    /**
     * Skip handler: surface reasons as snapshot progress events.
     */
    onSkip({ id, reason }) {
      emit({ kind: 'doc:skip', id, reason });
    },

    /**
     * Ref handler: expose graph edges as snapshot progress events.
     */
    onRefs({ id, refs }) {
      emit({ kind: 'doc:refs', id, refs });
    },
  });

  emit({ kind: 'complete', rootId, dir, processed });

  return {
    dir,
    processed,
    bytes: sumBytes(bytes),
  };
}
