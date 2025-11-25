import { type t, Crdt, Fs, slug, Time } from '../common.ts';
import { makeDiscoverRefs } from './u.process.discoverRefs.ts';
import { saveDoc } from './u.saveDoc.ts';

const sumBytes = (values: readonly number[]) => values.reduce((total, n) => total + n, 0);

type Args = {
  id: t.Crdt.Id;
  repo: t.Crdt.Repo;
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
export async function process(args: Args): Promise<ProcessResult> {
  const { base, repo, onProgress } = args;

  const emit = (event: t.CrdtSnapshotProgress) => onProgress?.(event);
  const now = args.now ?? Time.now.timestamp;
  const rootId = args.id;
  const dir = Fs.join(base, `crdt.${rootId}`, `snap.${now}.${slug().slice(3)}`);

  const bytes: { json: number[]; binary: number[] } = { json: [], binary: [] };
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
      await saveDoc({ repo, dir, doc, depth, isRoot, bytes, emit });
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
  emit({ kind: 'complete', rootId, dir, processed });
  return {
    dir,
    processed,
    bytes: {
      json: sumBytes(bytes.json),
      binary: sumBytes(bytes.binary),
    },
  };
}
