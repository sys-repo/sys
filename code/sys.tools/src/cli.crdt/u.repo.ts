import { type t, Crdt, D, Fs, Time, Try } from './common.ts';

/**
 * In-process repo cache keyed by absolute repo dir.
 * Coalesces concurrent opens and avoids duplicate sockets/watchers.
 */
const cache = new Map<string, Promise<t.Crdt.Repo>>();

/**
 * Construct (or reuse) a CRDT repo instance for a given cwd.
 * - Coalesces concurrent open calls per dir.
 * - Returns a ready repo.
 */
export async function ensureRepo(cwd: t.StringDir, ws?: string) {
  const dir = Fs.join(cwd, D.Path.repo);
  let pending = cache.get(dir);
  if (!pending) {
    pending = Crdt.repo({ dir, network: [ws] }).whenReady();
    cache.set(dir, pending);
  }
  return pending;
}

/**
 * Dispose and evict the cached repo for the given cwd (if any).
 * Safe to call even if there is no cached repo.
 */
export async function shutdown(cwd: t.StringDir) {
  const dir = Fs.join(cwd, D.Path.repo);
  const pending = cache.get(dir);
  if (!pending) return;
  cache.delete(dir);
  const repo = await pending;
  await Time.wait(0); // NB: allow current writes to flush before closing.
  await Try.catch(() => repo.dispose('shutdown'));
}
