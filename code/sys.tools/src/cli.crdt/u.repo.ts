import { type t, Crdt, D, Fs, Try } from './common.ts';

/**
 * In-process repo cache keyed by absolute repo dir.
 * Coalesces concurrent opens and avoids duplicate sockets/watchers.
 */
const repoCache = new Map<string, Promise<t.Crdt.Repo>>();

/**
 * Construct (or reuse) a CRDT repo instance for a given cwd.
 * - Coalesces concurrent open calls per dir.
 * - Returns a ready repo.
 */
export async function ensureRepo(cwd: t.StringDir, ws?: string) {
  const dir = Fs.join(cwd, D.Path.repo);
  let pending = repoCache.get(dir);
  if (!pending) {
    pending = Crdt.repo({ dir, network: [ws] }).whenReady();
    repoCache.set(dir, pending);
  }
  return pending;
}

/**
 * Dispose and evict the cached repo for the given cwd (if any).
 * Safe to call even if there is no cached repo.
 */
export async function shutdown(cwd: t.StringDir) {
  const dir = Fs.join(cwd, D.Path.repo);
  const pending = repoCache.get(dir);
  if (!pending) return;
  repoCache.delete(dir);
  const repo = await pending;
  await Try.catch(repo.dispose);
}
