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

  const { result } = await Try.run<t.CrdtDocWorkerProxy<T>>(async () => {
    const { doc, error } = await repo.get<T>(id, options);

    // Prefer domain error if present.
    if (error) throw error;

    // No doc and no error – this is a protocol violation.
    if (!doc) throw new Error(`CrdtWorker.doc: repo.get("${id}") returned no doc`);

    // Retrieve the port to run over.
    const port = getRepoPort(repo);
    if (!port) throw new Error(`A port for the parent repo "${repo.id}" could not be retrieved.`);

    // Construct the document-proxy.
    const ref = createDocProxy<T>(doc.id, port, repo.dispose$);
    return ref;
  });

  return result;
}
