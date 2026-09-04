import { Rx, type t } from './common.ts';

/**
 * Sets up listeners for tracking an aggregate of peer's network events.
 */
export function monitorNetwork(
  adapters: t.NetworkAdapterInterface[],
  until: t.UntilInput,
  onChange: t.CrdtNetworkChangeHandler,
) {
  const life = Rx.lifecycle(until);
  const disposers: Array<() => void> = [];
  const release = () => {
    for (const dispose of disposers.splice(0).reverse()) {
      try {
        dispose();
      } catch {
        /* Best-effort listener teardown. */
      }
    }
  };
  const attach = (subscribe: () => void, unsubscribe: () => void) => {
    disposers.push(unsubscribe);
    subscribe();
    return !life.disposed;
  };

  life.dispose$.subscribe(release);

  try {
    for (const adapter of adapters) {
      /**
       * Event Handlers:
       */
      const handlePeerOnline = (e: t.PeerCandidatePayload) => {
        const { peerId, peerMetadata: metadata } = e;
        onChange({ type: 'network/peer-online', payload: { peerId, metadata } });
      };

      const handlePeerOffline = (e: t.PeerDisconnectedPayload) => {
        const { peerId } = e;
        onChange({ type: 'network/peer-offline', payload: { peerId } });
      };

      const handleAdapterClose = () => {
        onChange({ type: 'network/close', payload: { adapter } });
      };

      /**
       * Wire-up / tear-down.
       */
      if (
        !attach(
          () => adapter.on('peer-candidate', handlePeerOnline),
          () => adapter.off('peer-candidate', handlePeerOnline),
        )
      ) break;
      if (
        !attach(
          () => adapter.on('peer-disconnected', handlePeerOffline),
          () => adapter.off('peer-disconnected', handlePeerOffline),
        )
      ) break;
      if (
        !attach(
          () => adapter.on('close', handleAdapterClose),
          () => adapter.off('close', handleAdapterClose),
        )
      ) break;
    }
  } catch (error) {
    life.dispose(error);
    throw error;
  }

  return life;
}
