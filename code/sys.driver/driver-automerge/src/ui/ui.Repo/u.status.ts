import { type t } from './common.ts';

/**
 * Consolidated state snapshot for a CRDT Repo.
 */
export function getStatus(repo: t.Crdt.Repo): t.Repo.Status {
  const ready = !!repo.status.ready;
  const syncEnabled = !!repo.sync.enabled;
  const peers = repo.sync.peers ?? [];
  const urls = repo.sync.urls ?? [];

  const hasPeers = peers.length > 0;
  const hasServers = urls.length > 0;

  let status: t.Repo.Status['status'];
  if (!syncEnabled) {
    status = 'offline';
  } else if (!hasPeers) {
    status = 'connecting';
  } else {
    status = 'online';
  }

  return {
    status,
    ready,
    syncEnabled,
    hasPeers,
    hasServers,
  };
}
