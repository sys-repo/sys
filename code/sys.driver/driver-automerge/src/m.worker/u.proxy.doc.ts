import { type t, CrdtIs, Try } from './common.ts';

type O = Record<string, unknown>;

/**
 * Fetch a document from a worker-proxied repo over RPC and return a
 * worker-branded CRDT ref wrapped in a TryResult.
 */
export async function doc<T extends O = O>(
  repo: t.CrdtRepoWorkerProxy | t.Crdt.Repo,
  id: t.StringId,
  options?: t.CrdtRepoGetOptions,
): Promise<t.TryResult<t.CrdtDocWorkerProxy<T>>> {
  if (!CrdtIs.proxy(repo)) throw new Error('invalid repo, worker-proxy expected');

  const { result } = await Try.run<t.CrdtDocWorkerProxy<T>>(async () => {
    const { doc, error } = await repo.get<T>(id, options);
    if (error) throw error;
    if (!doc) throw new Error(`CrdtWorker.doc: repo.get("${id}") returned no doc`);
    if (!CrdtIs.proxy(doc))
      throw new Error('CrdtWorker.doc: expected worker-proxy ref from repo.get');

    return doc as t.CrdtDocWorkerProxy<T>;
  });

  return result;
}
