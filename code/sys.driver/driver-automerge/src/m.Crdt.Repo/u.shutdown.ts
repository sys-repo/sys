import type { Repo } from '@automerge/automerge-repo';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';
import type { t } from './common.ts';

export async function silentShutdown(repo: Repo) {
  for (const adapter of repo.networkSubsystem.adapters) {
    ignoreErrorOnce(adapter);
  }

  try {
    await repo.shutdown();
  } catch {
    // Ignore.
  }
}

/** Preserve shutdown's existing one-error policy, including an already-queued setup abort. */
function ignoreErrorOnce(adapter: t.NetworkAdapterInterface) {
  if (!(adapter instanceof WebSocketClientAdapter)) return;
  const socket = adapter.socket;
  if (!socket) return;

  const onError = () => {};
  const onClose = () => socket.removeEventListener('error', onError);
  socket.addEventListener('error', onError, { once: true });
  socket.addEventListener('close', onClose, { once: true });
}
