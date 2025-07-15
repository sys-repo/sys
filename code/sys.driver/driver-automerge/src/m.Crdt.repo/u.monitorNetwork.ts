import { type t, rx } from './common.ts';

/**
 * Sets up listeners for tracking an aggregate of peer's network events.
 */
export function monitorNetwork(
  adapters: t.NetworkAdapterInterface[],
  dispose$: t.UntilInput,
  onChange: t.CrdtNetworkChangeHandler,
) {
  const life = rx.lifecycle(dispose$);
  const disposers: Array<() => void> = [];

  for (const adapter of adapters) {
    /**
     * Event Handlers:
     */
    const handlePeerOnline = (e: t.PeerCandidatePayload) => {
      const { peerId, peerMetadata: metadata } = e;
      onChange({ type: 'peer-online', payload: { peerId, metadata } });
    };

    const handlePeerOffline = (e: t.PeerDisconnectedPayload) => {
      const { peerId } = e;
      onChange({ type: 'peer-offline', payload: { peerId } });
    };

    const handleAdapterClose = () => {
      onChange({ type: 'network-close', payload: { adapter } });
    };

    /**
     * Wire-up / tear-down.
     */
    adapter.on('peer-candidate', handlePeerOnline);
    adapter.on('peer-disconnected', handlePeerOffline);
    adapter.on('close', handleAdapterClose);
    disposers.push(() => {
      adapter.off('peer-candidate', handlePeerOnline);
      adapter.off('peer-disconnected', handlePeerOffline);
      adapter.off('close', handleAdapterClose);
    });
  }

  // Finish up.
  life.dispose$.subscribe(() => disposers.forEach((d) => d()));
  return life;
}
