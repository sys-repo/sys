import { type t, Obj, Schedule } from './common.ts';
import { defaultDiscoverRefs } from './u.defaultDiscoverRefs.ts';
import { getWithRetry } from './u.getWithRetry.ts';

type O = Record<string, unknown>;

/**
 * Graph walker entrypoint.
 */
export const walk: t.CrdtGraphWalk = (args) => walkImpl(args);

/**
 * Graph walker implementation.
 *
 * Delegates:
 * - `onDoc`  : per-document work
 * - `onSkip` : skip reasons (already-processed / not-found / not-object)
 * - `onRefs` : observed outbound refs for each doc
 *
 * Discovery:
 * - By default: scans `doc.current` for string values that are CRDT URIs (`CrdtIs.uri`),
 *   normalises them via `CrdtId.clean`, and uses those as DAG edges.
 * - Can be overridden via `discoverRefs` on the walk args.
 *
 * Loading:
 * - If `repo` is provided: documents are loaded via `repo.get` with a bounded retry
 *   window (`getWithRetry`).
 * - If `load` is provided: documents are loaded via the caller-supplied loader.
 */
async function walkImpl<T extends O = O>(
  args: t.CrdtGraphWalkArgs<T>,
): Promise<t.CrdtGraphWalkResult> {
  const { onDoc, onSkip, onRefs, discoverRefs } = args;
  const edgeDiscovery = discoverRefs ?? defaultDiscoverRefs;

  const id = args.id;
  const depth = args.depth ?? 0;
  const processed = args.processed ?? [];

  /**
   * Normalized document loader.
   *
   * Note: narrowing is done directly with `'repo' in args` / `'load' in args`
   * so the compiler can see the union arms; we avoid storing those as booleans.
   */
  const loadDoc = async (docId: t.Crdt.Id): Promise<t.Crdt.Ref<T> | undefined> => {
    if ('repo' in args) {
      const { ok, doc } = await getWithRetry<T>(args.repo, docId);
      return ok ? doc : undefined;
    }

    if ('load' in args) {
      const doc = await args.load(docId);
      return doc ?? undefined;
    }

    return undefined;
  };

  // 1. Cycle protection.
  if (processed.includes(id)) {
    onSkip?.({ id, depth, reason: 'already-processed' });
    return { processed };
  }

  // 2. Retrieve document via the normalized loader.
  const doc = await loadDoc(id);
  if (!doc) {
    onSkip?.({ id, depth, reason: 'not-found' });
    return { processed };
  }

  // 3. Ensure the document shape is object-like.
  if (!Obj.isRecord(doc.current)) {
    onSkip?.({ id, depth, reason: 'not-object' });
    return { processed };
  }

  // 4. Mark as processed and invoke `onDoc`.
  processed.push(id);
  await onDoc({ depth, doc });

  // 5. Discover outbound references using either the caller-supplied
  //    `discoverRefs` hook or the default CRDT-URI-based implementation.
  const refsAry = await edgeDiscovery({ doc, depth });
  const refs: t.Crdt.Id[] = [...refsAry];

  if (refs.length > 0) {
    onRefs?.({ id, depth, refs });
  }

  // 6. Recurse into referenced documents (DAG walk).
  for (const refId of refs) {
    await walkImpl<T>({
      ...(args as t.CrdtGraphWalkArgs<T>),
      id: refId,
      depth: depth + 1,
      processed,
    });

    // Give the event-loop a breath so other work (spinners/UI) can run between docs.
    await Schedule.macro();
  }

  return { processed };
}
