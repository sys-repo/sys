import { type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Fetch a document over the worker-backed repo and return a worker-branded ref.
 *
 * - Wraps `repo.get(id, options)`.
 * - On domain errors (Timeout, NotFound, etc) rejects with the error object.
 * - On success, returns the `CrdtDocWorkerShim<T>` (branded `CrdtRef<T>`).
 */
export async function doc<T extends O = O>(
  repo: t.CrdtRepoWorkerShim,
  id: t.StringId,
  options?: t.CrdtRepoGetOptions,
): Promise<t.CrdtDocWorkerShim<T>> {
  const result = await repo.get<T>(id, options);

  if (result.error) throw result.error;
  if (!result.doc) throw new Error(`CrdtWorker.doc: repo.get("${id}") returned no doc`);

  const ref = result.doc as t.CrdtDocWorkerShim<T>;

  // Ensure the worker brand is present at runtime.
  (ref as { via?: 'worker-proxy' }).via = 'worker-proxy';

  return ref;
}
