import { type t, Schedule } from './common.ts';

type O = Record<string, unknown>;
export type GetWithRetryOptions = {
  /**
   * Maximum time (in milliseconds) to keep retrying when the repo
   * reports success (`ok: true`) but the document is not yet present.
   *
   * Defaults to 500ms.
   */
  readonly timeout?: t.Msecs;
};

/**
 * Small helper: `repo.get` with a bounded retry window for transient
 * "doc not yet available" cases (e.g. sync server still catching up).
 */
export async function getWithRetry<T extends O = O>(
  repo: t.Crdt.Repo,
  id: t.Crdt.Id,
  options: GetWithRetryOptions = {},
): Promise<{ ok: boolean; doc?: t.Crdt.Ref<T> }> {
  const { timeout = 500 } = options;
  const start = Date.now();

  while (true) {
    const res = await repo.get<T>(id);

    // Hard failure from the repo: don't spin, just surface the failure.
    if (!res.ok) return { ok: false };

    // Success + doc present.
    if (res.doc) return { ok: true, doc: res.doc };

    // Success, but doc not present yet: treat as "eventually consistent".
    const elapsed = Date.now() - start;
    if (elapsed >= timeout) return { ok: false };

    // Avoid hammering the worker; yield before retrying.
    await Schedule.macro();
  }
}
