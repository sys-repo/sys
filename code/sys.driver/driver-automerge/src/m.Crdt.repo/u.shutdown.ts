import type { Repo } from '@automerge/automerge-repo';
import { WebSocketClientAdapter } from '@automerge/automerge-repo-network-websocket';

export async function silentShutdown(repo: Repo) {
  // NB: supress any errors from sockets, that my throw if they
  //     are being closed before fully completing opening.
  for (const adapter of repo.networkSubsystem.adapters) {
    if (adapter instanceof WebSocketClientAdapter) {
      const ws: any = (adapter as any).socket;
      if (ws) ws.once('error', () => void 0);
    }
  }

  try {
    await repo.shutdown();
  } catch (error) {
    // Ignore.
  }
}
