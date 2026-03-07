import { type t, Obj, Schedule } from './common.ts';
import { defaultDiscoverRefs } from './u.defaultDiscoverRefs.ts';

type O = Record<string, unknown>;

/**
 * Graph walker entrypoint.
 */
export const walk: t.Graph.Walk = (args) => walkImpl(args);

/**
 * Graph walker implementation.
 *
 * Delegates:
 * - `onDoc`  : per-document work
 * - `onSkip` : skip reasons (already-processed / not-found / not-object)
 * - `onRefs` : observed outbound refs for each doc
 *
 * Discovery:
 * - By default, uses `Graph.default.discoverRefs` to compute outbound edges.
 * - Can be overridden via `discoverRefs` on the walk args.
 *
 * Loading:
 * - Documents are loaded via the caller-supplied `load(id)` function.
 */
async function walkImpl<T extends O = O>(args: t.Graph.WalkArgs<T>): Promise<t.Graph.WalkResult> {
  const { onDoc, onSkip, onRefs, discoverRefs, load } = args;
  const edgeDiscovery = discoverRefs ?? defaultDiscoverRefs;

  const id = args.id;
  const depth = args.depth ?? 0;
  const processed = args.processed ?? [];

  // 1. Cycle protection.
  if (processed.includes(id)) {
    onSkip?.({ id, depth, reason: 'already-processed' });
    return { processed };
  }

  // 2. Retrieve document via the caller-supplied loader.
  const doc = await load(id);
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
  await onDoc({ id, depth, doc });

  // 5. Discover outbound references using either the caller-supplied
  //    `discoverRefs` hook or the default implementation.
  const refsList = await edgeDiscovery({ id, doc, depth });
  const refs: t.StringId[] = [...refsList];

  if (refs.length > 0) {
    onRefs?.({ id, depth, refs });
  }

  // 6. Recurse into referenced documents (DAG walk).
  for (const refId of refs) {
    await walkImpl<T>({
      ...args,
      id: refId,
      depth: depth + 1,
      processed,
    });

    // Give the event-loop a breath so other work (spinners/UI) can run between docs.
    await Schedule.macro();
  }

  return { processed };
}
