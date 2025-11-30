import { type t, Graph } from './common.ts';
import { defaultDiscoverRefs } from './u.defaultDiscoverRefs.ts';
import { getWithRetry } from './u.getWithRetry.ts';

type O = Record<string, unknown>;

/**
 * CRDT graph walker entrypoint.
 *
 * Thin adapter over the generic immutable `Graph.walk`, adding:
 * - CRDT repo support via `getWithRetry`
 * - CRDT-flavoured default `discoverRefs`
 */
export const walk: t.CrdtGraphWalk = (args) => walkImpl(args);

async function walkImpl<T extends O = O>(
  args: t.CrdtGraphWalkArgs<T>,
): Promise<t.Graph.WalkResult> {
  /**
   * Normalised loader:
   * - If `repo` is present, use `getWithRetry(repo, id)`.
   * - Otherwise delegate to the caller-supplied `load(id)`.
   */
  const load: t.Graph.LoadDoc<T> = async (id) => {
    if ('repo' in args) {
      const { ok, doc } = await getWithRetry<T>(args.repo, id);
      return ok ? doc : undefined;
    }

    if ('load' in args) {
      return args.load(id);
    }

    return undefined;
  };

  return Graph.walk<T>({
    id: args.id,
    depth: args.depth,
    processed: args.processed,
    onDoc: args.onDoc,
    onSkip: args.onSkip,
    onRefs: args.onRefs,
    discoverRefs: args.discoverRefs ?? defaultDiscoverRefs,
    load,
  });
}
