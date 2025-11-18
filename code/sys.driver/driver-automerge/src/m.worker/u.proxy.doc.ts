import { type t, CrdtIs, Try } from './common.ts';
import { createDocProxy } from './u.proxy.docRef.ts';
import { getRepoPort } from './u.proxy.repo.ts';

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

  const port = getRepoPort(repo);
  const ref = createDocProxy<T>(id, port, repo.dispose$);

  const { result } = await Try.run<t.CrdtDocWorkerProxy<T>>(async () => {
    const { doc, error } = await repo.get<T>(id, options);

    if (error) {
      ref.dispose();
      throw error;
    }

    if (!doc) {
      ref.dispose();
      throw new Error(`CrdtWorker.doc: repo.get("${id}") returned no doc`);
    }

    if (doc.id !== id) {
      ref.dispose();
      const err = `CrdtWorker.doc: repo.get("${id}") returned doc "${doc.id}" (expected "${id}")`;
      throw new Error(err);
    }

    return ref;
  });

  return result;
}
