import type { Repo } from '@automerge/automerge-repo';
import type { t } from './common.ts';

import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';

export async function silentShutdown(repo: Repo) {
  // NB: supress any errors from sockets, that my throw if they
  //     are being closed before fully completing opening.
  for (const adapter of repo.networkSubsystem.adapters) {
    ignoreErrorOnce(adapter);
  }

  try {
    await repo.shutdown();
  } catch (error: t.IgnoredResult) {
    // Ignore.
  }
}

/**
 * Helpers:
 */
function ignoreErrorOnce(adapter: t.NetworkAdapterInterface) {
  if (adapter instanceof WebSocketClientAdapter) {
    const ws: any = (adapter as any).socket;
    if (ws) ws.once('error', () => void 0);
  }
}
