import { type t, CrdtIs, Try } from './common.ts';

type O = Record<string, unknown>;

/**
 * Fetch a document from a worker-proxied repo over RPC and return a
 * worker-branded CRDT ref wrapped in a TryResult.
 */
export async function doc<T extends O = O>(
  repo: t.CrdtRepoWorkerShim | t.Crdt.Repo,
  id: t.StringId,
  options?: t.CrdtRepoGetOptions,
): Promise<t.TryResult<t.CrdtDocWorkerShim<T>>> {
  if (!CrdtIs.proxy(repo)) throw new Error('invalid repo, worker-proxy expected');

  const { result } = await Try.run(async () => {
    const { doc, error } = await repo.get<T>(id, options);

    // Prefer domain error if present.
    if (error) throw error;

    // No doc and no error – this is a protocol violation.
    if (!doc) throw new Error(`CrdtWorker.doc: repo.get("${id}") returned no doc`);

    // Ensure the worker brand is present at runtime.
    const ref = doc as t.CrdtDocWorkerShim<T>;
    (ref as { via: 'worker-proxy' }).via = 'worker-proxy';

    return ref;
  });

  return result;
}
