import { type t, Schedule } from './common.ts';

type O = Record<string, unknown>;

/**
 * Small helper: `repo.get` with a minimal retry for transient failures.
 */
export async function getWithRetry<T extends O = O>(
  repo: t.Crdt.Repo,
  id: t.Crdt.Id,
): Promise<{ ok: boolean; doc?: t.Crdt.Ref<T> }> {
  const maxAttempts = 2;
  let attempt = 0;

  while (true) {
    const res = await repo.get<T>(id);
    if (res.ok && res.doc) return { ok: true, doc: res.doc };

    attempt += 1;
    if (attempt > maxAttempts) return { ok: false };

    // Avoid hammering the worker; yield before retrying.
    await Schedule.macro();
  }
}
