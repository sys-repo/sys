import { type t, Obj, Schedule, CrdtIs, CrdtId } from './common.ts';
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
 * - Scans `doc.current` for string values that are CRDT URIs (`CrdtIs.uri`).
 * - Normalises them to bare ids via `CrdtId.clean` and uses those as DAG edges.
 */
async function walkImpl<T extends O = O>(
  args: t.CrdtGraphWalkArgs<T>,
): Promise<t.CrdtGraphWalkResult> {
  const { repo, onDoc, onSkip, onRefs } = args;

  const id = args.id;
  const depth = args.depth ?? 0;
  const processed = args.processed ?? [];

  // 1. Cycle protection.
  if (processed.includes(id)) {
    onSkip?.({ id, depth, reason: 'already-processed' });
    return { processed };
  }

  // 2. Retrieve document (with a minimal retry for transient failures).
  const { ok, doc } = await getWithRetry<T>(repo, id);
  if (!ok || !doc) {
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

  // 5. Discover outbound references using CrdtIs/CrdtId.
  const refs: t.Crdt.Id[] = [];
  Obj.walk(doc.current, (e) => {
    const value = e.value;
    if (typeof value !== 'string') return;
    if (!CrdtIs.uri(value)) return;

    const refId = CrdtId.clean(value);
    if (!refId) return;

    refs.push(refId);
  });

  if (refs.length > 0) {
    onRefs?.({ id, depth, refs });
  }

  // 6. Recurse into referenced documents (DAG walk).
  for (const refId of refs) {
    await walkImpl<T>({
      repo,
      id: refId,
      depth: depth + 1,
      processed,
      onDoc,
      onSkip,
      onRefs,
    });

    // Give the event-loop a breath so other work (spinners/UI) can run between docs.
    await Schedule.macro();
  }

  return { processed };
}
